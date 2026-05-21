"use strict";
/**
 * Handler do estado ESCALAR_HUMANO.
 *
 * Contrato ([rag-test/estados/escalar-humano.md]):
 *  • Informar ao cliente que um atendente especializado irá assumir
 *  • Registrar: estado anterior, campos coletados, motivo da escalada
 *  • NÃO tentar resolver após escalar
 *  • NÃO prometer prazo de retorno sem saber
 *
 * O flag `escalarHumano: true` faz o state-router marcar o cliente com
 * `atendimentoHumano = true`, silenciando o bot até intervenção manual.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.escalarHumanoHandler = exports.EscalarHumanoHandler = void 0;
const states_1 = require("../states");
const MENSAGEM_ESCALADA = 'Entendi. Vou chamar um atendente da nossa equipe para te ajudar pessoalmente. Um momento!';
function inferirMotivo(estadoAnterior, message) {
    const msg = message.toLowerCase();
    if (/reclama|problema|errado|erro|insatisfeit/.test(msg))
        return 'Reclamação';
    if (/desconto|abuso|barato|caro/.test(msg))
        return 'Negociação acima da margem';
    if (/humano|atendente|gerente|pessoa/.test(msg))
        return 'Pedido explícito de atendente';
    return `Escalada a partir de ${estadoAnterior || 'estado indefinido'}`;
}
class EscalarHumanoHandler {
    async handle(message, sessao, _deps) {
        const motivo = inferirMotivo(sessao.estadoAnterior, message);
        const registro = {
            sessaoId: sessao.id,
            clienteId: sessao.clienteId,
            estadoAnterior: sessao.estadoAnterior,
            motivo,
            contexto: sessao.contexto,
            timestamp: new Date().toISOString(),
        };
        console.log('👤 [ESCALAR_HUMANO]', JSON.stringify(registro));
        return {
            response: MENSAGEM_ESCALADA,
            nextState: states_1.ConversationState.ESCALAR_HUMANO,
            updatedContext: sessao.contexto,
            escalarHumano: true,
        };
    }
}
exports.EscalarHumanoHandler = EscalarHumanoHandler;
exports.escalarHumanoHandler = new EscalarHumanoHandler();
