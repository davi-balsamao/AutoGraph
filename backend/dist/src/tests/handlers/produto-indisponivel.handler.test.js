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
const { produtoIndisponivelHandler } = require('../../fsm/handlers/produto-indisponivel.handler');
const { entityExtractionService } = require('../../services/entity-extraction.service');
describe('ProdutoIndisponivelHandler', () => {
    beforeEach(() => {
        entityExtractionService.extract.mockResolvedValue((0, helpers_1.makeEntities)());
        entityExtractionService.identificarProdutoNaMensagem.mockReturnValue(null);
    });
    it('lista catálogo na entrada padrão', async () => {
        const sessao = (0, helpers_1.makeSessao)();
        const r = await produtoIndisponivelHandler.handle('Quero camisetas', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.PRODUTO_INDISPONIVEL);
        expect(r.response).toMatch(/n[ãa]o est[áa] no nosso cat[áa]logo/i);
        expect(r.response).toMatch(/Panfletos|Cart[ãa]o|Banner|Apostila/);
    });
    it('encadeia para IDENTIFICAR_NECESSIDADE se cliente menciona produto válido', async () => {
        entityExtractionService.identificarProdutoNaMensagem.mockReturnValue({
            produto: 'Panfletos',
            descricao: 'x',
            requisitos_orcamento: [],
        });
        const sessao = (0, helpers_1.makeSessao)();
        const r = await produtoIndisponivelHandler.handle('então quero panfletos', sessao, (0, helpers_1.makeDeps)());
        expect(r.chainNext).toBe(states_1.ConversationState.IDENTIFICAR_NECESSIDADE);
    });
    it('encerra quando cliente recusa todas as alternativas', async () => {
        const sessao = (0, helpers_1.makeSessao)();
        const r = await produtoIndisponivelHandler.handle('Não quero nada disso, deixa pra lá', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.ENCERRAR);
    });
});
