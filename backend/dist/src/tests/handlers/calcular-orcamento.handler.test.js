"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const states_1 = require("../../fsm/states");
const calcular_orcamento_handler_1 = require("../../fsm/handlers/calcular-orcamento.handler");
const helpers_1 = require("./helpers");
jest.mock('../../adapters/pricing.adapter', () => ({
    PricingReadAdapter: {
        calcular: jest.fn(),
    },
}));
const { PricingReadAdapter } = require('../../adapters/pricing.adapter');
describe('CalcularOrcamentoHandler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.ADMIN_APPROVAL_REQUIRED = 'true';
    });
    it('calcula total determinístico e encadeia para aprovação admin', async () => {
        PricingReadAdapter.calcular.mockResolvedValue(1200);
        const sessao = (0, helpers_1.makeSessao)({
            contexto: {
                produto: 'Panfletos',
                specs: {
                    'Qual quantidade deseja?': '1000 unidades',
                },
            },
        });
        const r = await calcular_orcamento_handler_1.calcularOrcamentoHandler.handle('', sessao, (0, helpers_1.makeDeps)());
        expect(PricingReadAdapter.calcular).toHaveBeenCalledWith({
            produtoNome: 'Panfletos',
            quantidade: 1000,
            acabamento: undefined,
            specs: {
                'Qual quantidade deseja?': '1000 unidades',
            },
        });
        expect(r.chainNext).toBe(states_1.ConversationState.AGUARDAR_APROVACAO_ADMIN);
        expect(r.nextState).toBe(states_1.ConversationState.AGUARDAR_APROVACAO_ADMIN);
        expect(r.response).toBe('');
        expect(r.updatedContext.orcamento?.total).toBe(1200);
        expect(r.updatedContext.orcamento?.prazo).toBeTruthy();
        expect(r.updatedContext.orcamento?.validade).toBeTruthy();
    });
    it('quando aprovação admin está desativada, encadeia direto para apresentar orçamento', async () => {
        process.env.ADMIN_APPROVAL_REQUIRED = 'false';
        PricingReadAdapter.calcular.mockResolvedValue(750);
        const sessao = (0, helpers_1.makeSessao)({
            contexto: {
                produto: 'Cartão de Visita',
                specs: {
                    'Qual quantidade deseja?': '1000 unidades',
                },
            },
        });
        const r = await calcular_orcamento_handler_1.calcularOrcamentoHandler.handle('', sessao, (0, helpers_1.makeDeps)());
        expect(r.chainNext).toBe(states_1.ConversationState.APRESENTAR_ORCAMENTO);
        expect(r.nextState).toBe(states_1.ConversationState.APRESENTAR_ORCAMENTO);
        expect(r.updatedContext.orcamento?.total).toBe(750);
    });
    it('retorna erro controlado quando quantidade não foi identificada', async () => {
        const sessao = (0, helpers_1.makeSessao)({
            contexto: {
                produto: 'Outro Produto',
            },
        });
        const r = await calcular_orcamento_handler_1.calcularOrcamentoHandler.handle('', sessao, (0, helpers_1.makeDeps)());
        expect(PricingReadAdapter.calcular).not.toHaveBeenCalled();
        expect(r.nextState).toBe(states_1.ConversationState.ESCLARECER_DUVIDA);
        expect(r.response).toMatch(/não consegui calcular/i);
        expect(r.updatedContext.orcamento).toBeUndefined();
    });
    it('retorna erro controlado quando adapter não encontra produto no catálogo', async () => {
        PricingReadAdapter.calcular.mockRejectedValue(new Error('Produto não encontrado no catálogo.'));
        const sessao = (0, helpers_1.makeSessao)({
            contexto: {
                produto: 'Produto Inexistente',
                specs: {
                    'Qual quantidade deseja?': '100 unidades',
                },
            },
        });
        const r = await calcular_orcamento_handler_1.calcularOrcamentoHandler.handle('', sessao, (0, helpers_1.makeDeps)());
        expect(PricingReadAdapter.calcular).toHaveBeenCalled();
        expect(r.nextState).toBe(states_1.ConversationState.ESCLARECER_DUVIDA);
        expect(r.response).toMatch(/não consegui calcular/i);
        expect(r.updatedContext.orcamento).toBeUndefined();
    });
});
