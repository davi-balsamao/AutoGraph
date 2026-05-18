import { apresentarOrcamentoHandler } from '../../fsm/handlers/apresentar-orcamento.handler';
import { ConversationState } from '../../fsm/states';
import { makeDeps, makeRagMock, makeSessao } from './helpers';

describe('ApresentarOrcamentoHandler', () => {
  it('monta resposta com valor formatado em BRL e prazo', async () => {
    const sessao = makeSessao({
      contexto: {
        produto: 'Panfletos',
        orcamento: { total: 300, prazo: '3 dias úteis', validade: '3 dias úteis' },
      },
    });
    const r = await apresentarOrcamentoHandler.handle('', sessao, makeDeps());
    expect(r.nextState).toBe(ConversationState.AGUARDAR_APROVACAO);
    expect(r.response).toMatch(/R\$/);
    expect(r.response).toMatch(/3 dias [úu]teis/);
  });

  it('NÃO inclui "Podemos dar andamento?" (Fase 2 — apresentar-orcamento.md)', async () => {
    const sessao = makeSessao({
      contexto: {
        produto: 'Panfletos',
        orcamento: { total: 300, prazo: '3 dias', validade: '3 dias' },
      },
    });
    const r = await apresentarOrcamentoHandler.handle('', sessao, makeDeps());
    expect(r.response).not.toMatch(/Podemos dar andamento/i);
  });

  it('fallback RAG quando não há valor calculado', async () => {
    const sessao = makeSessao({ contexto: { produto: 'Panfletos' } });
    const rag = makeRagMock('Calculando seu orçamento...');
    const r = await apresentarOrcamentoHandler.handle('', sessao, makeDeps({ ragService: rag }));
    expect(rag.queryWithState).toHaveBeenCalled();
  });

  it('marca orcamentoApresentado=true no contexto', async () => {
    const sessao = makeSessao({
      contexto: { produto: 'Panfletos', orcamento: { total: 300, prazo: '3d', validade: '3d' } },
    });
    const r = await apresentarOrcamentoHandler.handle('', sessao, makeDeps());
    expect(r.updatedContext.orcamentoApresentado).toBe(true);
  });
});
