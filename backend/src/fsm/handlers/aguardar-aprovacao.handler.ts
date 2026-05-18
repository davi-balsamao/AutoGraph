/**
 * Handler do estado AGUARDAR_APROVACAO.
 *
 * Contrato ([rag-test/estados/aguardar-aprovacao.md]):
 *  • Aguardar resposta SEM enviar mensagens adicionais antes do timeout
 *  • NÃO repetir o orçamento antes do cliente reagir
 *  • Apenas roteia: APROVA → COLETAR_DADOS_ENTREGA, DUVIDA → ESCLARECER_DUVIDA,
 *    NEGOCIACAO → NEGOCIAR, RECUSA → ENCERRAR
 *
 * Quando há transição clara, encadeia para o próximo estado emitir a resposta —
 * este handler não fala por si, segue o .md.
 */

import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationState, SessaoRecord } from '../states';
import { transitionService } from '../transition.service';
import { prepareContext } from './base.handler';

// "Pode calcular / calcula / calcule" (com ou sem complemento — "o orçamento",
// "com 100 unidades", "o valor pra mim", ".") depois que o orçamento já foi
// apresentado é instrução redundante. O cliente está ecoando o pedido inicial
// sem perceber que já recebeu o valor. Tratamos de forma determinística para
// evitar uma rodada cara de RAG (que pode estourar o timeout do turno).
const PEDIDO_CALCULO_REDUNDANTE =
  /\b(pode|podem|podia|podiam|poderia|poderiam|d[áa])\s+calcul(ar|a|e)\b/i;

export class AguardarAprovacaoHandler implements StateHandler {
  async handle(
    message: string,
    sessao: SessaoRecord,
    deps: HandlerDeps
  ): Promise<HandlerResult> {
    const { context, entities } = await prepareContext(message, sessao, deps);

    const nextState = transitionService.resolve(
      ConversationState.AGUARDAR_APROVACAO,
      message,
      context,
      entities
    );

    // Transição reconhecida — encadeia, sem mensagem própria (próximo handler fala).
    if (
      nextState === ConversationState.COLETAR_DADOS_ENTREGA ||
      nextState === ConversationState.NEGOCIAR ||
      nextState === ConversationState.ESCLARECER_DUVIDA ||
      nextState === ConversationState.ENCERRAR ||
      nextState === ConversationState.ESCALAR_HUMANO
    ) {
      return {
        response: '',
        nextState,
        updatedContext: context,
        chainNext: nextState,
      };
    }

    // Cliente pede para calcular o orçamento (mas ele já foi calculado e
    // apresentado). Responde de forma curta lembrando que o orçamento está
    // pronto, sem repetir o valor e sem chamar o RAG.
    if (PEDIDO_CALCULO_REDUNDANTE.test(message) && context.orcamentoApresentado) {
      return {
        response: 'O orçamento já está pronto e foi enviado logo acima. Posso seguir com a aprovação para combinarmos a entrega?',
        nextState: ConversationState.AGUARDAR_APROVACAO,
        updatedContext: context,
      };
    }

    // Sem sinal claro do cliente — responde via RAG com prompt do estado,
    // que orienta o LLM a NÃO repetir o orçamento e pedir feedback objetivo.
    const ragResult = await deps.ragService.queryWithState(
      message || 'Cliente respondeu de forma ambígua sobre o orçamento. Peça uma resposta clara: aceita, recusa, ou tem dúvida?',
      ConversationState.AGUARDAR_APROVACAO,
      context,
      deps.conversationHistory || undefined
    );

    return {
      response: ragResult.answer,
      nextState: ConversationState.AGUARDAR_APROVACAO,
      updatedContext: context,
    };
  }
}

export const aguardarAprovacaoHandler = new AguardarAprovacaoHandler();
