import { ClienteRepository } from '../repositories/cliente.repository';
import { conversationService } from '../services/conversation.service';
import { entityExtractionService } from '../services/entity-extraction.service';
import { ragService } from '../services/rag.service';
import { stateService } from '../services/state.service';
import { notificationService } from '../services/notification.service';
import { formatarPerguntaCatalogo } from './catalog.util';
import { transitionService } from './transition.service';
import {
  detectSessionIntent,
  mensagemNovoAtendimento,
  mensagemTrocaProduto,
} from './intent.service';
import { getHandlerForState } from './handlers';
import { detectCrossCuttingIntent, enrichForLeigo } from './handlers/base.handler';
import { HandlerDeps } from './handler.types';
import {
  ConversationState,
  isConversationState,
  parseContext,
  SessaoRecord,
} from './states';
import { io } from '../server';

const clienteRepo = new ClienteRepository();

/**
 * Estados onde o middleware DUVIDA NÃO desvia para ESCLARECER_DUVIDA:
 *  · BOAS_VINDAS: ainda não há produto/contexto; handler chama RAG por conta.
 *  · ESCLARECER_DUVIDA: já é o destino, não faz sentido re-transitar.
 *  · ESCALAR_HUMANO: gerente assumiu, IA não deve agir.
 *  · ENCERRAR: o intent service já reabre nova sessão automaticamente.
 *  · AGUARDAR_RETORNO: sessão pausada, IA não responde.
 */
const ESTADOS_SEM_DESVIO_DUVIDA = new Set<ConversationState>([
  ConversationState.BOAS_VINDAS,
  ConversationState.ESCLARECER_DUVIDA,
  ConversationState.ESCALAR_HUMANO,
  ConversationState.ENCERRAR,
  ConversationState.AGUARDAR_RETORNO,
]);

export interface RouteResult {
  response: string;
  sessao: SessaoRecord;
  gerouOs?: boolean;
  osMeta?: { id: string; produto: string };
  escalarHumano?: boolean;
}

export interface ChainResult {
  responseParts: string[];
  sessao: SessaoRecord;
  gerouOs: boolean;
  osMeta?: { id: string; produto: string };
  escalarHumano: boolean;
}

/**
 * Executa o ciclo handler→handler (até `maxChain` saltos) a partir do estado
 * atual da sessão. Usado pelo router (entrada via webhook) e pelos endpoints
 * de aprovação admin, que precisam reentrar no FSM sem passar por detecção
 * de intent / histórico de cliente.
 */
export async function runHandlerChain(
  initialSessao: SessaoRecord,
  message: string,
  deps: HandlerDeps,
  maxChain: number = 4
): Promise<ChainResult> {
  let sessao = initialSessao;
  let currentState = isConversationState(sessao.estadoAtual)
    ? sessao.estadoAtual
    : ConversationState.BOAS_VINDAS;
  let context = parseContext(sessao.contexto);

  const responseParts: string[] = [];
  let gerouOs = false;
  let osMeta: { id: string; produto: string } | undefined;
  let escalarHumano = false;

  for (let step = 0; step < maxChain; step++) {
    const handler = getHandlerForState(currentState);
    const result = await handler.handle(
      message,
      { ...sessao, contexto: context, estadoAtual: currentState },
      deps
    );

    if (result.response?.trim()) {
      const texto = enrichForLeigo(result.response.trim(), deps.conversationHistory);
      responseParts.push(texto);
      console.log(
        `🤖 Handler [${currentState}]: "${texto.substring(0, 500)}${texto.length > 500 ? '...' : ''}"`
      );
    }
    context = result.updatedContext;
    escalarHumano = escalarHumano || !!result.escalarHumano;

    let nextState = result.nextState;
    let estadoAnterior: string | null | undefined = sessao.estadoAnterior;

    if (transitionService.shouldPushPreviousState(currentState, nextState)) {
      estadoAnterior = currentState;
    }

    if (
      nextState === ConversationState.ESCLARECER_DUVIDA &&
      currentState !== ConversationState.ESCLARECER_DUVIDA &&
      /\b(obrigad|entendi)\b/i.test(message) &&
      !result.chainNext
    ) {
      nextState = transitionService.restorePreviousState(estadoAnterior || null);
      estadoAnterior = null;
    }

    const updatedSessao = await stateService.transition(sessao.id, nextState, context, {
      previousState: estadoAnterior ?? undefined,
    });

    sessao = updatedSessao;
    currentState = nextState;

    if (result.gerarOs && context.osId) {
      gerouOs = true;
      osMeta = { id: context.osId, produto: context.produto || 'Pedido' };
      io.emit('nova-os', {
        id: context.osId,
        cliente: deps.clienteNome,
        produto: context.produto,
      });
    }

    if (escalarHumano) {
      await clienteRepo.updateAtendimentoStatus(sessao.clienteId, true);
      
      // Envia notificação push para os gerentes pelo Firebase FCM
      await notificationService.sendToAdmins(
        'Atendimento Escalado',
        `O cliente ${deps.clienteNome} precisa falar com um especialista.`,
        { 
          type: 'escalation',
          clienteId: sessao.clienteId,
          telefone: deps.clienteTelefone
        }
      );

      // Informa ao front-end em tempo real para atualizar o ícone do chat
      io.emit('conversa-assumida', { 
        clienteId: sessao.clienteId, 
        telefone: deps.clienteTelefone,
        clienteNome: deps.clienteNome,
      });
    }

    if (result.chainNext) {
      currentState = result.chainNext;
      continue;
    }

    break;
  }

  return { responseParts, sessao, gerouOs, osMeta, escalarHumano };
}

export class StateRouter {
  async route(
    sessao: SessaoRecord,
    message: string,
    clienteNome: string,
    clienteTelefone: string
  ): Promise<RouteResult> {
    let currentState = isConversationState(sessao.estadoAtual)
      ? sessao.estadoAtual
      : ConversationState.BOAS_VINDAS;

    // Fase 3: histórico é montado antes do intent porque o LLM precisa dele
    // para classificar (NOVO_ATENDIMENTO / TROCAR_PRODUTO / NONE).
    let context = parseContext(sessao.contexto);
    const history = await conversationService.getFormattedHistorySince(
      sessao.clienteId,
      sessao.criadoEm
    );
    const conversationHistory = history
      ? `${history}\nCliente: ${message}`
      : `Cliente: ${message}`;

    const intent = await detectSessionIntent(
      message,
      currentState,
      conversationHistory,
      context.produto
    );
    if (intent.type === 'NOVO_ATENDIMENTO' && currentState !== ConversationState.BOAS_VINDAS) {
      console.log('🔄 [FSM] Cliente pediu novo atendimento — sessão reiniciada.');
      // Se havia proposta pendente, avisa o dashboard pra remover o card.
      if (context.propostaPendente) {
        io.emit('proposta-cancelada', { sessaoId: sessao.id, motivo: 'NOVO_ATENDIMENTO' });
      }
      sessao = await stateService.reiniciarSessao(sessao.clienteId);
      const resposta = mensagemNovoAtendimento();
      sessao = await stateService.transition(
        sessao.id,
        ConversationState.IDENTIFICAR_NECESSIDADE,
        {},
        { previousState: null }
      );
      return { response: resposta, sessao };
    }

    if (
      intent.type === 'TROCAR_PRODUTO' &&
      currentState !== ConversationState.BOAS_VINDAS &&
      currentState !== ConversationState.GERAR_OS &&
      currentState !== ConversationState.ENCERRAR
    ) {
      console.log(
        `🔄 [FSM] Troca de produto${intent.produtoIdentificado ? `: ${intent.produtoIdentificado}` : ''}`
      );
      if (context.propostaPendente) {
        io.emit('proposta-cancelada', { sessaoId: sessao.id, motivo: 'TROCAR_PRODUTO' });
      }
      sessao = await stateService.reiniciarContextoPedido(
        sessao.id,
        intent.produtoIdentificado || undefined
      );

      let resposta = mensagemTrocaProduto(intent.produtoIdentificado);
      if (intent.produtoIdentificado) {
        const entities = await entityExtractionService.extract(`Cliente: ${message}`, {
          produtoAtual: intent.produtoIdentificado,
        });
        if (entities.perguntasFaltantes[0]) {
          resposta = formatarPerguntaCatalogo(entities.perguntasFaltantes[0]);
        }
      }

      return { response: resposta, sessao };
    }

    // Fluxo 6 / Regra 6 estendida — pedido explícito de pausa do cliente.
    // Cliente diz "preciso parar / continue depois / volto mais tarde" em
    // qualquer estado avançado → transita imediatamente para AGUARDAR_RETORNO.
    // O estado anterior é preservado para permitir retomada quando voltar.
    const crossCutting = detectCrossCuttingIntent(message);
    if (
      crossCutting === 'PAUSA' &&
      currentState !== ConversationState.AGUARDAR_RETORNO &&
      currentState !== ConversationState.ENCERRAR &&
      currentState !== ConversationState.BOAS_VINDAS
    ) {
      console.log(`⏸️  [FSM] Cliente pediu pausa em ${currentState} — entrando em AGUARDAR_RETORNO.`);
      sessao = await stateService.transition(
        sessao.id,
        ConversationState.AGUARDAR_RETORNO,
        context,
        { previousState: currentState },
      );
      return {
        response:
          'Tudo bem! Vou pausar seu atendimento aqui. Quando voltar, é só me mandar mensagem que retomamos de onde paramos.',
        sessao,
      };
    }

    const deps: HandlerDeps = {
      ragService,
      conversationHistory,
      clienteNome,
      clienteTelefone,
    };

    // Cross-cutting DUVIDA — pergunta aberta (catálogo, recomendação,
    // esclarecimento técnico) pode aparecer em qualquer estado avançado. Em vez
    // de cada handler tratar isso, o router intercepta e transita para
    // ESCLARECER_DUVIDA com previousState = currentState. O próprio
    // EsclarecerDuvidaHandler restaura o estado quando o cliente sinaliza
    // MOVING_FORWARD ("ok, vou de X", "entendi, prefiro Y").
    if (
      crossCutting === 'DUVIDA' &&
      !ESTADOS_SEM_DESVIO_DUVIDA.has(currentState)
    ) {
      console.log(`❓ [FSM] Dúvida detectada em ${currentState} — desviando para ESCLARECER_DUVIDA.`);
      sessao = await stateService.transition(
        sessao.id,
        ConversationState.ESCLARECER_DUVIDA,
        context,
        { previousState: currentState }
      );

      const chainDuvida = await runHandlerChain(sessao, message, deps);
      return {
        response: chainDuvida.responseParts.join('\n') || 'Um momento, por favor.',
        sessao: chainDuvida.sessao,
        gerouOs: chainDuvida.gerouOs,
        osMeta: chainDuvida.osMeta,
        escalarHumano: chainDuvida.escalarHumano,
      };
    }

    const chain = await runHandlerChain(sessao, message, deps);

    // Se o chain terminou em AGUARDAR_APROVACAO_ADMIN sem produzir resposta,
    // sinaliza silêncio total (não manda fallback pro WhatsApp).
    const silencioAdmin =
      chain.responseParts.length === 0 &&
      chain.sessao.estadoAtual === ConversationState.AGUARDAR_APROVACAO_ADMIN;

    return {
      response: silencioAdmin
        ? ''
        : chain.responseParts.join('\n') || 'Um momento, por favor.',
      sessao: chain.sessao,
      gerouOs: chain.gerouOs,
      osMeta: chain.osMeta,
      escalarHumano: chain.escalarHumano,
    };
  }
}

export const stateRouter = new StateRouter();
