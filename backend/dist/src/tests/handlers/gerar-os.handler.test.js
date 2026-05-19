"use strict";
/**
 * Mock do OsRepository é montado ANTES do import do handler porque o handler
 * instancia o repository no nível do módulo.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const mockOsCreate = jest.fn();
jest.mock('../../repositories/os.repository', () => ({
    OsRepository: jest.fn().mockImplementation(() => ({
        create: mockOsCreate,
    })),
}));
const states_1 = require("../../fsm/states");
const helpers_1 = require("./helpers");
const { gerarOsHandler } = require('../../fsm/handlers/gerar-os.handler');
describe('GerarOsHandler', () => {
    beforeEach(() => {
        mockOsCreate.mockReset();
        mockOsCreate.mockResolvedValue({ id: 'os-abc12345-1234-abcd' });
    });
    it('cria O.S. com produto e specs do contexto', async () => {
        const sessao = (0, helpers_1.makeSessao)({
            contexto: {
                produto: 'Panfletos',
                specs: { 'Qual quantidade deseja?': '1000 unidades' },
                orcamento: { total: 300, prazo: '3 dias', validade: '3 dias' },
                entrega: { modalidade: 'retirada' },
            },
        });
        const r = await gerarOsHandler.handle('', sessao, (0, helpers_1.makeDeps)({ clienteNome: 'Davi' }));
        expect(mockOsCreate).toHaveBeenCalledTimes(1);
        const arg = mockOsCreate.mock.calls[0][0];
        expect(arg.especificacoes.produto).toBe('Panfletos');
        expect(arg.mensagem_sugerida).toContain('Davi');
        expect(arg.mensagem_sugerida).toContain('Panfletos');
    });
    it('Fase 2: NÃO grava observações técnicas (recepcionista preenche)', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: { produto: 'Panfletos' } });
        await gerarOsHandler.handle('', sessao, (0, helpers_1.makeDeps)({ clienteNome: 'Ana' }));
        const arg = mockOsCreate.mock.calls[0][0];
        expect(arg.observacoes).toBeUndefined();
    });
    it('retorna nextState=ENCERRAR e flag gerarOs=true', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: { produto: 'Panfletos' } });
        const r = await gerarOsHandler.handle('', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.ENCERRAR);
        expect(r.gerarOs).toBe(true);
        expect(r.updatedContext.osId).toBeTruthy();
        expect(r.response).toMatch(/Ordem de Servi[çc]o/);
    });
});
