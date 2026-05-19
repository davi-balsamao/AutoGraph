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
const { esclarecerDuvidaHandler } = require('../../fsm/handlers/esclarecer-duvida.handler');
const { entityExtractionService } = require('../../services/entity-extraction.service');
describe('EsclarecerDuvidaHandler', () => {
    beforeEach(() => {
        entityExtractionService.extract.mockResolvedValue((0, helpers_1.makeEntities)());
    });
    it('permanece em ESCLARECER_DUVIDA enquanto cliente pergunta', async () => {
        const sessao = (0, helpers_1.makeSessao)({
            estadoAtual: 'ESCLARECER_DUVIDA',
            estadoAnterior: 'IDENTIFICAR_NECESSIDADE',
        });
        const rag = (0, helpers_1.makeRagMock)('Panfletos são folhetos para divulgação.');
        const r = await esclarecerDuvidaHandler.handle('O que são panfletos?', sessao, (0, helpers_1.makeDeps)({ ragService: rag }));
        expect(r.nextState).toBe(states_1.ConversationState.ESCLARECER_DUVIDA);
    });
    it('sai para estado anterior quando cliente sinaliza progresso (sem produto)', async () => {
        const sessao = (0, helpers_1.makeSessao)({
            estadoAtual: 'ESCLARECER_DUVIDA',
            estadoAnterior: 'IDENTIFICAR_NECESSIDADE',
        });
        const r = await esclarecerDuvidaHandler.handle('Entendi, obrigado!', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.IDENTIFICAR_NECESSIDADE);
    });
    it('promove para COLETAR_ESPECIFICACOES quando há produto e cliente avança', async () => {
        entityExtractionService.extract.mockResolvedValue((0, helpers_1.makeEntities)({ produtoIdentificado: 'Panfletos' }));
        const sessao = (0, helpers_1.makeSessao)({
            estadoAtual: 'ESCLARECER_DUVIDA',
            estadoAnterior: 'IDENTIFICAR_NECESSIDADE',
            contexto: { produto: 'Panfletos' },
        });
        const r = await esclarecerDuvidaHandler.handle('Vou de panfleto então', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.COLETAR_ESPECIFICACOES);
    });
});
