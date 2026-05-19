"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const encerrar_handler_1 = require("../../fsm/handlers/encerrar.handler");
const states_1 = require("../../fsm/states");
const helpers_1 = require("./helpers");
describe('EncerrarHandler', () => {
    it('inclui número da O.S. quando contexto tem osId', async () => {
        const sessao = (0, helpers_1.makeSessao)({
            contexto: { osId: 'abcdef1234567890', produto: 'Panfletos' },
        });
        const r = await encerrar_handler_1.encerrarHandler.handle('Obrigado!', sessao, (0, helpers_1.makeDeps)({ clienteNome: 'Davi Balsamao' }));
        expect(r.nextState).toBe(states_1.ConversationState.ENCERRAR);
        expect(r.response).toContain('Davi');
        expect(r.response).toContain('ABCDEF12');
        expect(r.response).toMatch(/O\.S\./);
    });
    it('responde sem O.S. quando contexto está vazio (recusa, indisponível, etc.)', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: {} });
        const r = await encerrar_handler_1.encerrarHandler.handle('Tchau', sessao, (0, helpers_1.makeDeps)({ clienteNome: 'Ana' }));
        expect(r.nextState).toBe(states_1.ConversationState.ENCERRAR);
        expect(r.response).toContain('Ana');
        expect(r.response).not.toMatch(/O\.S\./);
    });
    it('lida graciosamente com cliente sem nome', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: {} });
        const r = await encerrar_handler_1.encerrarHandler.handle('', sessao, (0, helpers_1.makeDeps)({ clienteNome: '' }));
        expect(r.response).toContain('cliente');
    });
});
