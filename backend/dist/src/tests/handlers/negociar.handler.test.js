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
const { negociarHandler } = require('../../fsm/handlers/negociar.handler');
const { entityExtractionService } = require('../../services/entity-extraction.service');
describe('NegociarHandler', () => {
    beforeEach(() => {
        entityExtractionService.extract.mockResolvedValue((0, helpers_1.makeEntities)());
    });
    it('escala para ESCALAR_HUMANO quando cliente exige desconto acima da margem', async () => {
        // Total R$ 700 → margem máxima 10%. Cliente pede 40%.
        const sessao = (0, helpers_1.makeSessao)({
            contexto: { produto: 'Banner ou Lona', orcamento: { total: 700, prazo: '3 dias', validade: '3 dias' } },
        });
        const r = await negociarHandler.handle('Quero 40% de desconto!', sessao, (0, helpers_1.makeDeps)());
        expect(r.chainNext).toBe(states_1.ConversationState.ESCALAR_HUMANO);
    });
    it('NÃO escala quando desconto pedido está dentro da margem', async () => {
        // Total R$ 700 → margem máxima 10%. Cliente pede 8%.
        const sessao = (0, helpers_1.makeSessao)({
            contexto: { produto: 'Banner ou Lona', orcamento: { total: 700, prazo: '3 dias', validade: '3 dias' } },
        });
        const rag = (0, helpers_1.makeRagMock)('Posso fechar com 8% no Pix.');
        const r = await negociarHandler.handle('Consegue 8% de desconto?', sessao, (0, helpers_1.makeDeps)({ ragService: rag }));
        expect(r.chainNext).not.toBe(states_1.ConversationState.ESCALAR_HUMANO);
        expect(rag.queryWithState).toHaveBeenCalled();
    });
    it('encadeia para COLETAR_DADOS_ENTREGA quando cliente aceita após negociação', async () => {
        const sessao = (0, helpers_1.makeSessao)({
            contexto: { produto: 'Panfletos', orcamento: { total: 300, prazo: '3 dias', validade: '3 dias' } },
        });
        const r = await negociarHandler.handle('Ok, aceito esse valor.', sessao, (0, helpers_1.makeDeps)());
        expect(r.chainNext).toBe(states_1.ConversationState.COLETAR_DADOS_ENTREGA);
    });
    it('encadeia para ENCERRAR quando cliente recusa após negociação', async () => {
        const sessao = (0, helpers_1.makeSessao)({
            contexto: { produto: 'Panfletos', orcamento: { total: 300, prazo: '3 dias', validade: '3 dias' } },
        });
        const r = await negociarHandler.handle('não quero mais', sessao, (0, helpers_1.makeDeps)());
        expect(r.chainNext).toBe(states_1.ConversationState.ENCERRAR);
    });
    it('chama RAG e permanece em NEGOCIAR para mensagem aberta sem desconto explícito', async () => {
        const sessao = (0, helpers_1.makeSessao)({
            contexto: { produto: 'Panfletos', orcamento: { total: 300, prazo: '3 dias', validade: '3 dias' } },
        });
        const rag = (0, helpers_1.makeRagMock)('Posso ajustar o acabamento para reduzir.');
        const r = await negociarHandler.handle('Ainda achei caro, tem outra opção?', sessao, (0, helpers_1.makeDeps)({ ragService: rag }));
        expect(r.nextState).toBe(states_1.ConversationState.NEGOCIAR);
        expect(rag.queryWithState).toHaveBeenCalled();
    });
});
