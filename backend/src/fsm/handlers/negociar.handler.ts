/**
 * Handler do estado NEGOCIAR.
 *
 * Contrato ([rag-test/estados/negociar.md] + Regra 5):
 *  • Verificar margem máxima antes de responder
 *  • NUNCA prometer desconto sem verificar margem
 *  • Oferecer alternativas: menos acabamento, quantidade maior, prazo mais longo
 *  • Acima da margem → escalar
 *
 * A margem é aplicada de duas formas:
 *  1. Pré-filtro: se cliente exige desconto > margem permitida, escala direto
 *  2. Pós-filtro: guardrails.service valida que o LLM não retornou preço fora da margem
 */

import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationState, SessaoRecord } from '../states';
import { transitionService } from '../transition.service';
import { getMaxDiscountPercent, prepareContext, validateDiscountMargin } from './base.handler';

const DESCONTO_PERCENT_RE = /(\d{1,3})\s*%/;

function extrairDescontoPercentual(message: string): number | null {
  const match = message.match(DESCONTO_PERCENT_RE);
  if (!match) return null;
  const pct = Number(match[1]);
  if (!Number.isFinite(pct) || pct <= 0) return null;
  return pct;
}

export class NegociarHandler implements StateHandler {
  async handle(
    message: string,
    sessao: SessaoRecord,
    deps: HandlerDeps
  ): Promise<HandlerResult> {
    const { context, entities } = await prepareContext(message, sessao, deps);

    // Regra 5: se cliente pede desconto explícito acima da margem, escala.
    const propostaPct = extrairDescontoPercentual(message);
    const orderTotal = context.orcamento?.total ?? 0;
    const margemMax = getMaxDiscountPercent(orderTotal);

    if (propostaPct !== null && !validateDiscountMargin(propostaPct, margemMax)) {
      console.log(
        `🚨 [Negociar] Desconto pedido ${propostaPct}% > margem ${margemMax}% (total R$${orderTotal}) — escalando.`
      );
      return {
        response: '',
        nextState: ConversationState.ESCALAR_HUMANO,
        updatedContext: context,
        chainNext: ConversationState.ESCALAR_HUMANO,
      };
    }

    // Roteamento por outras saídas (aprovação/recusa após contraproposta).
    const transitioned = transitionService.resolve(
      ConversationState.NEGOCIAR,
      message,
      context,
      entities
    );

    if (
      transitioned === ConversationState.COLETAR_DADOS_ENTREGA ||
      transitioned === ConversationState.ENCERRAR ||
      transitioned === ConversationState.ESCALAR_HUMANO
    ) {
      return {
        response: '',
        nextState: transitioned,
        updatedContext: context,
        chainNext: transitioned,
      };
    }

    // Permanece em NEGOCIAR — RAG monta contraproposta com base em diretrizes_negociacao.
    // Guardrails (preço autorizado) já filtram a resposta antes de retornar.
    const ragResult = await deps.ragService.queryWithState(
      message,
      ConversationState.NEGOCIAR,
      context,
      deps.conversationHistory || undefined
    );

    return {
      response: ragResult.answer,
      nextState: ConversationState.NEGOCIAR,
      updatedContext: context,
    };
  }
}

export const negociarHandler = new NegociarHandler();
