"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const states_1 = require("../../fsm/states");
const helpers_1 = require("./helpers");
jest.mock('../../services/entity-extraction.service', () => ({
    entityExtractionService: {
        extract: jest.fn(),
        identificarProdutoNaMensagem: jest.fn(),
    },
}));
const { confirmarPedidoHandler } = require('../../fsm/handlers/confirmar-pedido.handler');
const { entityExtractionService } = require('../../services/entity-extraction.service');
describe('ConfirmarPedidoHandler', () => {
    beforeEach(() => {
        entityExtractionService.extract.mockResolvedValue((0, helpers_1.makeEntities)());
    });
    const ctxBase = {
        produto: 'Panfletos',
        specs: { 'Qual quantidade deseja?': '1000 unidades' },
        orcamento: { total: 300, prazo: '3 dias úteis', validade: '3 dias úteis' },
        entrega: { modalidade: 'retirada' },
    };
    it('emite resumo determinístico quando mensagem chega vazia (chain entry)', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: ctxBase });
        const r = await confirmarPedidoHandler.handle('', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.CONFIRMAR_PEDIDO);
        expect(r.response).toContain('Vamos confirmar seu pedido');
        expect(r.response).toContain('Panfletos');
        expect(r.response).toContain('R$');
        expect(r.response).toContain('Retirada na loja');
        expect(r.response).toContain('Confirma este pedido?');
    });
    it('encadeia para GERAR_OS quando cliente confirma', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: ctxBase });
        const r = await confirmarPedidoHandler.handle('Confirmo o pedido.', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.GERAR_OS);
        expect(r.chainNext).toBe(states_1.ConversationState.GERAR_OS);
        expect(r.response).toBe('');
    });
    it('volta a COLETAR_ESPECIFICACOES quando cliente quer corrigir', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: ctxBase });
        const r = await confirmarPedidoHandler.handle('tá errado, quero trocar a quantidade', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.COLETAR_ESPECIFICACOES);
        expect(r.response).toMatch(/refa[çc]o/i);
    });
    it('re-pergunta com o resumo quando resposta é ambígua', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: ctxBase });
        const r = await confirmarPedidoHandler.handle('hmmm', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.CONFIRMAR_PEDIDO);
        expect(r.response).toContain('Confirma este pedido?');
    });
    it('aceita entrega com endereço no resumo', async () => {
        const sessao = (0, helpers_1.makeSessao)({
            contexto: { ...ctxBase, entrega: { modalidade: 'entrega', endereco: 'Av. Brasil 500' } },
        });
        const r = await confirmarPedidoHandler.handle('', sessao, (0, helpers_1.makeDeps)());
        expect(r.response).toContain('Entrega em: Av. Brasil 500');
    });
});
