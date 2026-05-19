"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apresentar_orcamento_handler_1 = require("../../fsm/handlers/apresentar-orcamento.handler");
const states_1 = require("../../fsm/states");
const helpers_1 = require("./helpers");
describe('ApresentarOrcamentoHandler', () => {
    it('monta resposta com valor formatado em BRL e prazo', async () => {
        const sessao = (0, helpers_1.makeSessao)({
            contexto: {
                produto: 'Panfletos',
                orcamento: { total: 300, prazo: '3 dias úteis', validade: '3 dias úteis' },
            },
        });
        const r = await apresentar_orcamento_handler_1.apresentarOrcamentoHandler.handle('', sessao, (0, helpers_1.makeDeps)());
        expect(r.nextState).toBe(states_1.ConversationState.AGUARDAR_APROVACAO);
        expect(r.response).toMatch(/R\$/);
        expect(r.response).toMatch(/3 dias [úu]teis/);
    });
    it('NÃO inclui "Podemos dar andamento?" (Fase 2 — apresentar-orcamento.md)', async () => {
        const sessao = (0, helpers_1.makeSessao)({
            contexto: {
                produto: 'Panfletos',
                orcamento: { total: 300, prazo: '3 dias', validade: '3 dias' },
            },
        });
        const r = await apresentar_orcamento_handler_1.apresentarOrcamentoHandler.handle('', sessao, (0, helpers_1.makeDeps)());
        expect(r.response).not.toMatch(/Podemos dar andamento/i);
    });
    it('fallback RAG quando não há valor calculado', async () => {
        const sessao = (0, helpers_1.makeSessao)({ contexto: { produto: 'Panfletos' } });
        const rag = (0, helpers_1.makeRagMock)('Calculando seu orçamento...');
        const r = await apresentar_orcamento_handler_1.apresentarOrcamentoHandler.handle('', sessao, (0, helpers_1.makeDeps)({ ragService: rag }));
        expect(rag.queryWithState).toHaveBeenCalled();
    });
    it('marca orcamentoApresentado=true no contexto', async () => {
        const sessao = (0, helpers_1.makeSessao)({
            contexto: { produto: 'Panfletos', orcamento: { total: 300, prazo: '3d', validade: '3d' } },
        });
        const r = await apresentar_orcamento_handler_1.apresentarOrcamentoHandler.handle('', sessao, (0, helpers_1.makeDeps)());
        expect(r.updatedContext.orcamentoApresentado).toBe(true);
    });
});
