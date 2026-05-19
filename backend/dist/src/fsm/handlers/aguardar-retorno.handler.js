"use strict";
/**
 * Handler do estado AGUARDAR_RETORNO.
 *
 * Contrato ([rag-test/estados/aguardar-retorno.md] + Regra 6):
 *  • Cliente está inativo após algum estado avançado
 *  • Lembrete ÚNICO via cron, controlado por `sessao.lembreteEnviado`
 *  • Encerra automaticamente após timeout máximo (via cron)
 *  • Cliente retornando → restaura fluxo no estado anterior
 *
 * Este handler é acionado quando cliente VOLTA a mandar mensagem.
 * O envio proativo do lembrete é feito pelo cron — não aqui.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.aguardarRetornoHandler = exports.AguardarRetornoHandler = void 0;
const entity_extraction_service_1 = require("../../services/entity-extraction.service");
const states_1 = require("../states");
const transition_service_1 = require("../transition.service");
const base_handler_1 = require("./base.handler");
class AguardarRetornoHandler {
    async handle(message, sessao, deps) {
        const { context } = await (0, base_handler_1.prepareContext)(message, sessao, deps);
        const msg = message.trim();
        if (!msg) {
            return {
                response: '',
                nextState: states_1.ConversationState.AGUARDAR_RETORNO,
                updatedContext: context,
            };
        }
        // Cliente identificou produto na mensagem → retoma direto em coleta.
        const produto = entity_extraction_service_1.entityExtractionService.identificarProdutoNaMensagem(msg);
        if (produto) {
            return {
                response: '',
                nextState: states_1.ConversationState.COLETAR_ESPECIFICACOES,
                updatedContext: { ...context, produto: produto.produto },
                chainNext: states_1.ConversationState.COLETAR_ESPECIFICACOES,
            };
        }
        // Caso geral: volta ao estado anterior, ou IDENTIFICAR_NECESSIDADE se desconhecido.
        const estadoRetomar = transition_service_1.transitionService.restorePreviousState(sessao.estadoAnterior);
        return {
            response: 'Que bom que voltou! Vamos retomar de onde paramos.',
            nextState: estadoRetomar,
            updatedContext: context,
        };
    }
}
exports.AguardarRetornoHandler = AguardarRetornoHandler;
exports.aguardarRetornoHandler = new AguardarRetornoHandler();
