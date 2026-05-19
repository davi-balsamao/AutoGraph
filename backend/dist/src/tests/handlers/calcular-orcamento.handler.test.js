"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const calcular_orcamento_handler_1 = require("../../fsm/handlers/calcular-orcamento.handler");
const states_1 = require("../../fsm/states");
const helpers_1 = require("./helpers");
describe('CalcularOrcamentoHandler', () => {
    it('calcula total a partir de panfletos × quantidade e encadeia para APRESENTAR', async () => {
        const sessao = (0, helpers_1.makeSessao)({
            contexto: {
                produto: 'Panfletos',
                specs: { 'Qual quantidade deseja?': '1000 unidades' },
            },
        });
        const r = await calcular_orcamento_handler_1.calcularOrcamentoHandler.handle('', sessao, (0, helpers_1.makeDeps)());
        expect(r.chainNext).toBe(states_1.ConversationState.APRESENTAR_ORCAMENTO);
        expect(r.updatedContext.orcamento?.total).toBeGreaterThan(0);
        expect(r.updatedContext.orcamento?.prazo).toBeTruthy();
        expect(r.updatedContext.orcamento?.validade).toBeTruthy();
    });
    it('aplica preço mínimo do produto', async () => {
        const sessao = (0, helpers_1.makeSessao)({
            contexto: { produto: 'Cartão de Visita', specs: { 'Qual quantidade deseja?': '10 unidades' } },
        });
        const r = await calcular_orcamento_handler_1.calcularOrcamentoHandler.handle('', sessao, (0, helpers_1.makeDeps)());
        // Mínimo de cartão de visita é R$ 55
        expect(r.updatedContext.orcamento?.total).toBeGreaterThanOrEqual(55);
    });
    it('usa preço default para produto fora dos casos conhecidos', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: { produto: 'Outro Produto' } });
        const r = await calcular_orcamento_handler_1.calcularOrcamentoHandler.handle('', sessao, (0, helpers_1.makeDeps)());
        expect(r.updatedContext.orcamento?.total).toBeGreaterThan(0);
    });
});
