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
const { aguardarRetornoHandler } = require('../../fsm/handlers/aguardar-retorno.handler');
const { entityExtractionService } = require('../../services/entity-extraction.service');
describe('AguardarRetornoHandler', () => {
    beforeEach(() => {
        entityExtractionService.extract.mockResolvedValue((0, helpers_1.makeEntities)());
        entityExtractionService.identificarProdutoNaMensagem.mockReturnValue(null);
    });
    it('encadeia para COLETAR_ESPECIFICACOES quando cliente menciona produto válido', async () => {
        entityExtractionService.identificarProdutoNaMensagem.mockReturnValue({
            produto: 'Cartão de Visita',
            descricao: 'x',
            requisitos_orcamento: [],
        });
        const sessao = (0, helpers_1.makeSessao)({ estadoAnterior: 'IDENTIFICAR_NECESSIDADE' });
        const r = await aguardarRetornoHandler.handle('voltei, quero cartões de visita', sessao, (0, helpers_1.makeDeps)());
        expect(r.chainNext).toBe(states_1.ConversationState.COLETAR_ESPECIFICACOES);
        expect(r.updatedContext.produto).toBe('Cartão de Visita');
    });
    it('restaura estado anterior para mensagem genérica', async () => {
        const sessao = (0, helpers_1.makeSessao)({ estadoAnterior: 'COLETAR_ESPECIFICACOES' });
        const r = await aguardarRetornoHandler.handle('oi, voltei', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.COLETAR_ESPECIFICACOES);
        expect(r.response).toMatch(/voltou/i);
    });
    it('cai em IDENTIFICAR_NECESSIDADE quando não há estadoAnterior', async () => {
        const sessao = (0, helpers_1.makeSessao)({ estadoAnterior: null });
        const r = await aguardarRetornoHandler.handle('oi', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.IDENTIFICAR_NECESSIDADE);
    });
    it('permanece em AGUARDAR_RETORNO para mensagem vazia (lembrete enviado pelo cron)', async () => {
        const sessao = (0, helpers_1.makeSessao)();
        const r = await aguardarRetornoHandler.handle('', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.AGUARDAR_RETORNO);
        expect(r.response).toBe('');
    });
});
