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
const { aguardarAprovacaoHandler } = require('../../fsm/handlers/aguardar-aprovacao.handler');
const { entityExtractionService } = require('../../services/entity-extraction.service');
describe('AguardarAprovacaoHandler', () => {
    beforeEach(() => {
        entityExtractionService.extract.mockResolvedValue((0, helpers_1.makeEntities)());
    });
    const ctx = {
        produto: 'Panfletos',
        orcamento: { total: 300, prazo: '3 dias úteis', validade: '3 dias úteis' },
    };
    it('encadeia para COLETAR_DADOS_ENTREGA ao detectar aprovação', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: ctx });
        const r = await aguardarAprovacaoHandler.handle('Aprovado!', sessao, (0, helpers_1.makeDeps)());
        expect(r.chainNext).toBe(states_1.ConversationState.COLETAR_DADOS_ENTREGA);
        expect(r.response).toBe('');
    });
    it('encadeia para NEGOCIAR ao detectar objeção de preço', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: ctx });
        const r = await aguardarAprovacaoHandler.handle('tá caro demais, tem desconto?', sessao, (0, helpers_1.makeDeps)());
        expect(r.chainNext).toBe(states_1.ConversationState.NEGOCIAR);
    });
    it('encadeia para ESCLARECER_DUVIDA ao detectar dúvida', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: ctx });
        const r = await aguardarAprovacaoHandler.handle('qual a diferença para o outro produto?', sessao, (0, helpers_1.makeDeps)());
        expect(r.chainNext).toBe(states_1.ConversationState.ESCLARECER_DUVIDA);
    });
    it('encadeia para ENCERRAR ao detectar recusa', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: ctx });
        const r = await aguardarAprovacaoHandler.handle('cancela tudo', sessao, (0, helpers_1.makeDeps)());
        expect(r.chainNext).toBe(states_1.ConversationState.ENCERRAR);
    });
    it('chama RAG quando sinal do cliente é ambíguo (sem repetir orçamento)', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: ctx });
        const rag = (0, helpers_1.makeRagMock)('Posso te ajudar com algo mais sobre o orçamento?');
        const r = await aguardarAprovacaoHandler.handle('hmm vou pensar', sessao, (0, helpers_1.makeDeps)({ ragService: rag }));
        expect(r.nextState).toBe(states_1.ConversationState.AGUARDAR_APROVACAO);
        expect(r.chainNext).toBeUndefined();
        expect(rag.queryWithState).toHaveBeenCalled();
    });
});
