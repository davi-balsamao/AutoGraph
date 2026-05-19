"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.aguardarAprovacaoHandler = exports.AguardarAprovacaoHandler = void 0;
const states_1 = require("../states");
const transition_service_1 = require("../transition.service");
const base_handler_1 = require("./base.handler");
// "Pode calcular / calcula / calcule" (com ou sem complemento — "o orçamento",
// "com 100 unidades", "o valor pra mim", ".") depois que o orçamento já foi
// apresentado é instrução redundante. O cliente está ecoando o pedido inicial
// sem perceber que já recebeu o valor. Tratamos de forma determinística para
// evitar uma rodada cara de RAG (que pode estourar o timeout do turno).
const PEDIDO_CALCULO_REDUNDANTE = /\b(pode|podem|podia|podiam|poderia|poderiam|d[áa])\s+calcul(ar|a|e)\b/i;
class AguardarAprovacaoHandler {
    async handle(message, sessao, deps) {
        const { context, entities } = await (0, base_handler_1.prepareContext)(message, sessao, deps);
        const nextState = transition_service_1.transitionService.resolve(states_1.ConversationState.AGUARDAR_APROVACAO, message, context, entities);
        // Transição reconhecida — encadeia, sem mensagem própria (próximo handler fala).
        if (nextState === states_1.ConversationState.COLETAR_DADOS_ENTREGA ||
            nextState === states_1.ConversationState.NEGOCIAR ||
            nextState === states_1.ConversationState.ESCLARECER_DUVIDA ||
            nextState === states_1.ConversationState.ENCERRAR ||
            nextState === states_1.ConversationState.ESCALAR_HUMANO) {
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
                nextState: states_1.ConversationState.AGUARDAR_APROVACAO,
                updatedContext: context,
            };
        }
        // Sem sinal claro do cliente — responde via RAG com prompt do estado,
        // que orienta o LLM a NÃO repetir o orçamento e pedir feedback objetivo.
        const ragResult = await deps.ragService.queryWithState(message || 'Cliente respondeu de forma ambígua sobre o orçamento. Peça uma resposta clara: aceita, recusa, ou tem dúvida?', states_1.ConversationState.AGUARDAR_APROVACAO, context, deps.conversationHistory || undefined);
        return {
            response: ragResult.answer,
            nextState: states_1.ConversationState.AGUARDAR_APROVACAO,
            updatedContext: context,
        };
    }
}
exports.AguardarAprovacaoHandler = AguardarAprovacaoHandler;
exports.aguardarAprovacaoHandler = new AguardarAprovacaoHandler();
