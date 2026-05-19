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
const { coletarDadosEntregaHandler } = require('../../fsm/handlers/coletar-dados-entrega.handler');
const { entityExtractionService } = require('../../services/entity-extraction.service');
describe('ColetarDadosEntregaHandler', () => {
    beforeEach(() => {
        entityExtractionService.extract.mockResolvedValue((0, helpers_1.makeEntities)());
    });
    it('pergunta modalidade quando entra sem mensagem e sem modalidade', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: { produto: 'Panfletos' } });
        const r = await coletarDadosEntregaHandler.handle('', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.COLETAR_DADOS_ENTREGA);
        expect(r.response).toMatch(/retirar.*loja.*entrega/i);
    });
    it('detecta retirada e encadeia para CONFIRMAR_PEDIDO', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: { produto: 'Panfletos' } });
        const r = await coletarDadosEntregaHandler.handle('Vou retirar na loja', sessao, (0, helpers_1.makeDeps)());
        expect(r.updatedContext.entrega?.modalidade).toBe('retirada');
        expect(r.chainNext).toBe(states_1.ConversationState.CONFIRMAR_PEDIDO);
    });
    it('detecta entrega com endereço completo e encadeia', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: { produto: 'Panfletos' } });
        const r = await coletarDadosEntregaHandler.handle('Quero entrega. Av. Brasil, 500, São Paulo', sessao, (0, helpers_1.makeDeps)());
        expect(r.updatedContext.entrega?.modalidade).toBe('entrega');
        expect(r.updatedContext.entrega?.endereco).toContain('Av. Brasil');
        expect(r.chainNext).toBe(states_1.ConversationState.CONFIRMAR_PEDIDO);
    });
    it('detecta entrega sem endereço completo e pergunta progressivamente', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: { produto: 'Panfletos' } });
        const r = await coletarDadosEntregaHandler.handle('Quero entrega', sessao, (0, helpers_1.makeDeps)());
        expect(r.updatedContext.entrega?.modalidade).toBe('entrega');
        expect(r.nextState).toBe(states_1.ConversationState.COLETAR_DADOS_ENTREGA);
        expect(r.response).toMatch(/endere[çc]o completo/i);
    });
    it('re-pergunta modalidade quando mensagem é ambígua', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: { produto: 'Panfletos' } });
        const r = await coletarDadosEntregaHandler.handle('beleza', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.COLETAR_DADOS_ENTREGA);
        expect(r.response).toMatch(/retirar.*entrega/i);
    });
});
