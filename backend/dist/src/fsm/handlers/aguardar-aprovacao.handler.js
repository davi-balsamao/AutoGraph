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
// "Pode calcular / calcula / calcule" depois que o orçamento já foi apresentado
// é instrução redundante. Tratamos de forma determinística para evitar RAG.
const PEDIDO_CALCULO_REDUNDANTE = /\b(pode|podem|podia|podiam|poderia|poderiam|d[áa])\s+calcul(ar|a|e)\b/i;
// Cliente já recebeu o orçamento e está sinalizando forma de pagamento.
// Isso deve avançar o fluxo sem chamar RAG e sem recalcular orçamento.
const INTENCAO_PAGAMENTO = /\b(pix|pagar|pagamento|cart[aã]o|cartao|cr[eé]dito|credito|d[eé]bito|debito|boleto|transfer[eê]ncia|transferencia)\b/i;
// Respostas que não são recusa definitiva.
// Ex.: "vou pensar" não deve encerrar o atendimento automaticamente.
const RESPOSTA_AMBIGUA = /\b(vou pensar|pensar melhor|ver depois|te aviso|vou ver|preciso pensar|vou analisar|vou decidir|retorno depois|falo depois)\b/i;
class AguardarAprovacaoHandler {
    async handle(message, sessao, deps) {
        const { context, entities } = await (0, base_handler_1.prepareContext)(message, sessao, deps);
        const nextState = transition_service_1.transitionService.resolve(states_1.ConversationState.AGUARDAR_APROVACAO, message, context, entities);
        // Se o cliente falou em pagamento, consideramos que ele quer seguir.
        // Não chama RAG, não tenta recalcular e não pede especificações novamente.
        if (INTENCAO_PAGAMENTO.test(message)) {
            return {
                response: 'Perfeito! Vou registrar que você deseja seguir com o pagamento. Nossa equipe vai te orientar com os próximos passos para pagamento e entrega.',
                nextState: states_1.ConversationState.COLETAR_DADOS_ENTREGA,
                updatedContext: {
                    ...context,
                    specs: {
                        ...(context.specs || {}),
                        formaPagamentoPreferida: message,
                    },
                },
                chainNext: states_1.ConversationState.COLETAR_DADOS_ENTREGA,
            };
        }
        // Resposta ambígua: não encerra, não aprova, não recalcula.
        // Mantém em AGUARDAR_APROVACAO e usa RAG controlado do estado.
        if (RESPOSTA_AMBIGUA.test(message)) {
            const ragResult = await deps.ragService.queryWithState(message ||
                'Cliente respondeu de forma ambígua sobre o orçamento. Peça uma resposta clara: aceita, recusa, ou tem dúvida?', states_1.ConversationState.AGUARDAR_APROVACAO, context, deps.conversationHistory || undefined);
            return {
                response: ragResult.answer,
                nextState: states_1.ConversationState.AGUARDAR_APROVACAO,
                updatedContext: context,
            };
        }
        // Transição reconhecida — encadeia, sem mensagem própria.
        // O próximo handler emite a resposta.
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
        // Cliente pede para calcular o orçamento, mas ele já foi calculado/apresentado.
        // Responde de forma curta, sem repetir valor e sem chamar RAG.
        if (PEDIDO_CALCULO_REDUNDANTE.test(message) && context.orcamentoApresentado) {
            return {
                response: 'O orçamento já está pronto e foi enviado logo acima. Posso seguir com a aprovação para combinarmos a entrega?',
                nextState: states_1.ConversationState.AGUARDAR_APROVACAO,
                updatedContext: context,
            };
        }
        // Sem sinal claro do cliente — responde via RAG com prompt do estado.
        const ragResult = await deps.ragService.queryWithState(message ||
            'Cliente respondeu de forma ambígua sobre o orçamento. Peça uma resposta clara: aceita, recusa, ou tem dúvida?', states_1.ConversationState.AGUARDAR_APROVACAO, context, deps.conversationHistory || undefined);
        return {
            response: ragResult.answer,
            nextState: states_1.ConversationState.AGUARDAR_APROVACAO,
            updatedContext: context,
        };
    }
}
exports.AguardarAprovacaoHandler = AguardarAprovacaoHandler;
exports.aguardarAprovacaoHandler = new AguardarAprovacaoHandler();
