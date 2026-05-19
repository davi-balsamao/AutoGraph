"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.negociarHandler = exports.NegociarHandler = void 0;
const states_1 = require("../states");
const transition_service_1 = require("../transition.service");
const base_handler_1 = require("./base.handler");
const DESCONTO_PERCENT_RE = /(\d{1,3})\s*%/;
function extrairDescontoPercentual(message) {
    const match = message.match(DESCONTO_PERCENT_RE);
    if (!match)
        return null;
    const pct = Number(match[1]);
    if (!Number.isFinite(pct) || pct <= 0)
        return null;
    return pct;
}
class NegociarHandler {
    async handle(message, sessao, deps) {
        const { context, entities } = await (0, base_handler_1.prepareContext)(message, sessao, deps);
        // Regra 5: se cliente pede desconto explícito acima da margem, escala.
        const propostaPct = extrairDescontoPercentual(message);
        const orderTotal = context.orcamento?.total ?? 0;
        const margemMax = (0, base_handler_1.getMaxDiscountPercent)(orderTotal);
        if (propostaPct !== null && !(0, base_handler_1.validateDiscountMargin)(propostaPct, margemMax)) {
            console.log(`🚨 [Negociar] Desconto pedido ${propostaPct}% > margem ${margemMax}% (total R$${orderTotal}) — escalando.`);
            return {
                response: '',
                nextState: states_1.ConversationState.ESCALAR_HUMANO,
                updatedContext: context,
                chainNext: states_1.ConversationState.ESCALAR_HUMANO,
            };
        }
        // Roteamento por outras saídas (aprovação/recusa após contraproposta).
        const transitioned = transition_service_1.transitionService.resolve(states_1.ConversationState.NEGOCIAR, message, context, entities);
        if (transitioned === states_1.ConversationState.COLETAR_DADOS_ENTREGA ||
            transitioned === states_1.ConversationState.ENCERRAR ||
            transitioned === states_1.ConversationState.ESCALAR_HUMANO) {
            return {
                response: '',
                nextState: transitioned,
                updatedContext: context,
                chainNext: transitioned,
            };
        }
        // Permanece em NEGOCIAR — RAG monta contraproposta com base em diretrizes_negociacao.
        // Guardrails (preço autorizado) já filtram a resposta antes de retornar.
        const ragResult = await deps.ragService.queryWithState(message, states_1.ConversationState.NEGOCIAR, context, deps.conversationHistory || undefined);
        return {
            response: ragResult.answer,
            nextState: states_1.ConversationState.NEGOCIAR,
            updatedContext: context,
        };
    }
}
exports.NegociarHandler = NegociarHandler;
exports.negociarHandler = new NegociarHandler();
