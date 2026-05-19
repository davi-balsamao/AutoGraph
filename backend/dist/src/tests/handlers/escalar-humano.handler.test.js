"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const states_1 = require("../../fsm/states");
const escalar_humano_handler_1 = require("../../fsm/handlers/escalar-humano.handler");
const helpers_1 = require("./helpers");
describe('EscalarHumanoHandler', () => {
    it('seta flag escalarHumano e responde com cortesia', async () => {
        const sessao = (0, helpers_1.makeSessao)({ estadoAnterior: 'NEGOCIAR' });
        const r = await escalar_humano_handler_1.escalarHumanoHandler.handle('quero falar com gerente', sessao, (0, helpers_1.makeDeps)());
        expect(r.escalarHumano).toBe(true);
        expect(r.nextState).toBe(states_1.ConversationState.ESCALAR_HUMANO);
        expect(r.response).toMatch(/atendente/i);
    });
    it('infere motivo "Reclamação" para mensagens com problema/erro', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        const sessao = (0, helpers_1.makeSessao)({ estadoAnterior: 'BOAS_VINDAS' });
        await escalar_humano_handler_1.escalarHumanoHandler.handle('o pedido saiu todo errado', sessao, (0, helpers_1.makeDeps)());
        const calls = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
        expect(calls).toMatch(/Reclama[çc][ãa]o/);
        logSpy.mockRestore();
    });
    it('infere motivo "Negociação acima da margem"', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        const sessao = (0, helpers_1.makeSessao)({ estadoAnterior: 'NEGOCIAR' });
        await escalar_humano_handler_1.escalarHumanoHandler.handle('isso é caro demais, vocês cobram absurdo', sessao, (0, helpers_1.makeDeps)());
        const calls = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
        expect(calls).toMatch(/Negocia[çc][ãa]o acima da margem/);
        logSpy.mockRestore();
    });
});
