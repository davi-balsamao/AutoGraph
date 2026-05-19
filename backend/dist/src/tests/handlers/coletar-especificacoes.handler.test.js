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
const { coletarEspecificacoesHandler } = require('../../fsm/handlers/coletar-especificacoes.handler');
const { entityExtractionService } = require('../../services/entity-extraction.service');
describe('ColetarEspecificacoesHandler', () => {
    beforeEach(() => {
        entityExtractionService.extract.mockResolvedValue((0, helpers_1.makeEntities)());
        entityExtractionService.identificarProdutoNaMensagem.mockReturnValue(null);
    });
    it('encadeia para CALCULAR_ORCAMENTO quando specs estão completas (produto sem arte)', async () => {
        entityExtractionService.extract.mockResolvedValue((0, helpers_1.makeEntities)({
            produtoIdentificado: 'Apostila',
            completo: true,
        }));
        const sessao = (0, helpers_1.makeSessao)({
            estadoAtual: 'COLETAR_ESPECIFICACOES',
            contexto: { produto: 'Apostila', specsPendentes: [] },
        });
        const r = await coletarEspecificacoesHandler.handle('50 páginas A4 frente e verso colorido com espiral', sessao, (0, helpers_1.makeDeps)());
        expect(r.chainNext).toBe(states_1.ConversationState.CALCULAR_ORCAMENTO);
    });
    it('pede arquivo de arte ao completar specs de produto que exige arte', async () => {
        entityExtractionService.extract.mockResolvedValue((0, helpers_1.makeEntities)({
            produtoIdentificado: 'Panfletos',
            completo: true,
            perguntasFaltantes: [],
        }));
        const sessao = (0, helpers_1.makeSessao)({
            estadoAtual: 'COLETAR_ESPECIFICACOES',
            contexto: { produto: 'Panfletos', specsPendentes: [] },
        });
        const r = await coletarEspecificacoesHandler.handle('1000 unidades 10x14cm frente e verso', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.VALIDAR_ARQUIVO);
        expect(r.response).toMatch(/arquivo de arte/i);
    });
    it('pergunta a próxima spec quando há pendências', async () => {
        entityExtractionService.extract.mockResolvedValue((0, helpers_1.makeEntities)({
            produtoIdentificado: 'Panfletos',
            completo: false,
            perguntasFaltantes: ['Qual quantidade deseja?'],
        }));
        const sessao = (0, helpers_1.makeSessao)({
            estadoAtual: 'COLETAR_ESPECIFICACOES',
            contexto: { produto: 'Panfletos' },
        });
        const r = await coletarEspecificacoesHandler.handle('quero panfletos', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.COLETAR_ESPECIFICACOES);
        expect(r.response).toMatch(/quantidade/i);
    });
    it('aceita tamanho personalizado sem regredir', async () => {
        const sessao = (0, helpers_1.makeSessao)({
            estadoAtual: 'COLETAR_ESPECIFICACOES',
            contexto: { produto: 'Banner ou Lona' },
        });
        const r = await coletarEspecificacoesHandler.handle('queria um tamanho maior, personalizado', sessao, (0, helpers_1.makeDeps)());
        expect(r.response).toMatch(/tamanho.*personalizad|largura.*altura/i);
        expect(r.nextState).toBe(states_1.ConversationState.COLETAR_ESPECIFICACOES);
    });
});
