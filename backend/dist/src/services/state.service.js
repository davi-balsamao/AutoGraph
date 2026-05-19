"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stateService = exports.StateService = void 0;
const sessao_repository_1 = require("../repositories/sessao.repository");
const states_1 = require("../fsm/states");
class StateService {
    async getOrCreateSession(clienteId) {
        let sessao = await sessao_repository_1.sessaoRepository.findActiveByClienteId(clienteId);
        if (!sessao) {
            sessao = await sessao_repository_1.sessaoRepository.create(clienteId);
        }
        return this.toRecord(sessao);
    }
    async transition(sessaoId, nextState, context, options) {
        const updated = await sessao_repository_1.sessaoRepository.updateState(sessaoId, nextState, options?.previousState, context);
        return this.toRecord(updated);
    }
    async encerrar(sessaoId) {
        await sessao_repository_1.sessaoRepository.encerrar(sessaoId);
    }
    /** Encerra a sessão ativa e abre outra em BOAS_VINDAS (novo pedido do zero). */
    async reiniciarSessao(clienteId) {
        const ativa = await sessao_repository_1.sessaoRepository.findActiveByClienteId(clienteId);
        if (ativa) {
            await sessao_repository_1.sessaoRepository.encerrar(ativa.id);
        }
        const nova = await sessao_repository_1.sessaoRepository.create(clienteId);
        return this.toRecord(nova);
    }
    /** Limpa specs/orçamento; mantém a mesma sessão. */
    async reiniciarContextoPedido(sessaoId, produto) {
        const contexto = produto ? { produto } : {};
        const estado = produto
            ? states_1.ConversationState.COLETAR_ESPECIFICACOES
            : states_1.ConversationState.IDENTIFICAR_NECESSIDADE;
        const updated = await sessao_repository_1.sessaoRepository.updateState(sessaoId, estado, null, contexto);
        await sessao_repository_1.sessaoRepository.setLembreteEnviado(sessaoId, false);
        return this.toRecord(updated);
    }
    toRecord(sessao) {
        return {
            id: sessao.id,
            clienteId: sessao.clienteId,
            estadoAtual: sessao.estadoAtual,
            estadoAnterior: sessao.estadoAnterior,
            contexto: (0, states_1.parseContext)(sessao.contexto),
            ativa: sessao.ativa,
            lembreteEnviado: sessao.lembreteEnviado,
            criadoEm: sessao.criadoEm,
            atualizadoEm: sessao.atualizadoEm,
        };
    }
}
exports.StateService = StateService;
exports.stateService = new StateService();
