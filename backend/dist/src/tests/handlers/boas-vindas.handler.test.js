"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const boas_vindas_handler_1 = require("../../fsm/handlers/boas-vindas.handler");
const states_1 = require("../../fsm/states");
const helpers_1 = require("./helpers");
describe('BoasVindasHandler', () => {
    it('saudação simples termina em "Como posso te ajudar?"', async () => {
        const sessao = (0, helpers_1.makeSessao)({ estadoAtual: 'BOAS_VINDAS' });
        const r = await boas_vindas_handler_1.boasVindasHandler.handle('Oi', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.IDENTIFICAR_NECESSIDADE);
        expect(r.response).toMatch(/Bom dia|Boa tarde|Boa noite/);
        expect(r.response).toMatch(/Como posso te ajudar\?/);
    });
    it('responde "Tudo bem e voce?" quando cliente pergunta', async () => {
        const sessao = (0, helpers_1.makeSessao)({ estadoAtual: 'BOAS_VINDAS' });
        const r = await boas_vindas_handler_1.boasVindasHandler.handle('Oi, tudo bem?', sessao, (0, helpers_1.makeDeps)());
        expect(r.response).toMatch(/Tudo bem e voce/);
    });
    it('NÃO lista catálogo de produtos proativamente (Regra do .md)', async () => {
        const sessao = (0, helpers_1.makeSessao)({ estadoAtual: 'BOAS_VINDAS' });
        const r = await boas_vindas_handler_1.boasVindasHandler.handle('Oi', sessao, (0, helpers_1.makeDeps)());
        expect(r.response).not.toMatch(/Panfletos|Cart[ãa]o|Banner|Apostila|Blocos/);
    });
});
