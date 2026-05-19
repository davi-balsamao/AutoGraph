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
const { validarArquivoHandler } = require('../../fsm/handlers/validar-arquivo.handler');
const { entityExtractionService } = require('../../services/entity-extraction.service');
describe('ValidarArquivoHandler', () => {
    beforeEach(() => {
        entityExtractionService.extract.mockResolvedValue((0, helpers_1.makeEntities)());
    });
    it('encadeia para CALCULAR quando cliente confirma ter a arte', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: { produto: 'Panfletos' } });
        const r = await validarArquivoHandler.handle('Sim, tenho o arquivo pronto em PDF', sessao, (0, helpers_1.makeDeps)());
        expect(r.chainNext).toBe(states_1.ConversationState.CALCULAR_ORCAMENTO);
        expect(r.updatedContext.validacaoArteOk).toBe(true);
    });
    it('orienta e permanece quando cliente não tem arte', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: { produto: 'Panfletos' } });
        const r = await validarArquivoHandler.handle('Não tenho arte ainda', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.VALIDAR_ARQUIVO);
        expect(r.response).toMatch(/designer|canva/i);
        expect(r.response).toMatch(/pdf|jpg|png|tiff/i);
    });
    it('transita para AGUARDAR_RETORNO quando cliente vai enviar depois', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: { produto: 'Panfletos' } });
        const r = await validarArquivoHandler.handle('Te mando depois', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.AGUARDAR_RETORNO);
    });
    it('re-pergunta para mensagem ambígua', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: { produto: 'Panfletos' } });
        const r = await validarArquivoHandler.handle('beleza', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.VALIDAR_ARQUIVO);
        expect(r.response).toMatch(/arquivo de arte/i);
    });
});
