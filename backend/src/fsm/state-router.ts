import { ClienteRepository } from '../repositories/cliente.repository';
import { conversationService } from '../services/conversation.service';
import { entityExtractionService } from '../services/entity-extraction.service';
import { ragService } from '../services/rag.service';
import { stateService } from '../services/state.service';
import { formatarPerguntaCatalogo } from './catalog.util';
import { transitionService } from './transition.service';
import {
  detectSessionIntent,
  mensagemNovoAtendimento,
  mensagemTrocaProduto,
} from './intent.service';
import { getHandlerForState } from './handlers';
import { enrichForLeigo } from './handlers/base.handler';
import { HandlerDeps, HandlerResult } from './handler.types';
import {
  ConversationState,
  isConversationState,
  parseContext,
  SessaoRecord,
} from './states';
import { io } from '../server';

const clienteRepo = new ClienteRepository();

export interface RouteResult {
  response: string;
  sessao: SessaoRecord;
  gerouOs?: boolean;
  osMeta?: { id: string; produto: string };
  escalarHumano?: boolean;
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

    const responseParts: string[] = [];
    let gerouOs = false;
    let osMeta: { id: string; produto: string } | undefined;
    let escalarHumano = false;

    const deps: HandlerDeps = {
      ragService,
      conversationHistory,
      clienteNome,
      clienteTelefone,
    };

    const maxChain = 4;
    for (let step = 0; step < maxChain; step++) {
      const handler = getHandlerForState(currentState);
      const result: HandlerResult = await handler.handle(message, { ...sessao, contexto: context, estadoAtual: currentState }, deps);

      if (result.response?.trim()) {
        // Middleware Regra 9 — enriquece termos técnicos para o leigo.
        // Idempotente e contexto-sensível: se cliente já usou os termos no
        // histórico, não adiciona explicação.
        const texto = enrichForLeigo(result.response.trim(), conversationHistory);
        responseParts.push(texto);
        console.log(`🤖 Handler [${currentState}]: "${texto.substring(0, 500)}${texto.length > 500 ? '...' : ''}"`);
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
        /\b(obrigad|entendi)\b/i.test(message)
      ) {
        nextState = transitionService.restorePreviousState(sessao.estadoAnterior);
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
          cliente: clienteNome,
          produto: context.produto,
        });
      }

      if (escalarHumano) {
        await clienteRepo.updateAtendimentoStatus(sessao.clienteId, true);
      }

      if (result.chainNext) {
        currentState = result.chainNext;
        message = '';
        continue;
      }

      break;
    }

    return {
      response: responseParts.join('\n') || 'Um momento, por favor.',
      sessao,
      gerouOs,
      osMeta,
      escalarHumano,
    };
  }
}

export const stateRouter = new StateRouter();
