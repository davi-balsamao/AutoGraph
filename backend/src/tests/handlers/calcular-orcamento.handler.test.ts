import { calcularOrcamentoHandler } from '../../fsm/handlers/calcular-orcamento.handler';
import { ConversationState } from '../../fsm/states';
import { makeDeps, makeSessao } from './helpers';

describe('CalcularOrcamentoHandler', () => {
  it('calcula total a partir de panfletos × quantidade e encadeia para APRESENTAR', async () => {
    const sessao = makeSessao({
      contexto: {
        produto: 'Panfletos',
        specs: { 'Qual quantidade deseja?': '1000 unidades' },
      },
    });
    const r = await calcularOrcamentoHandler.handle('', sessao, makeDeps());

    expect(r.chainNext).toBe(ConversationState.APRESENTAR_ORCAMENTO);
    expect(r.updatedContext.orcamento?.total).toBeGreaterThan(0);
    expect(r.updatedContext.orcamento?.prazo).toBeTruthy();
    expect(r.updatedContext.orcamento?.validade).toBeTruthy();
  });

  it('aplica preço mínimo do produto', async () => {
    const sessao = makeSessao({
      contexto: { produto: 'Cartão de Visita', specs: { 'Qual quantidade deseja?': '10 unidades' } },
    });
    const r = await calcularOrcamentoHandler.handle('', sessao, makeDeps());
    // Mínimo de cartão de visita é R$ 55
    expect(r.updatedContext.orcamento?.total).toBeGreaterThanOrEqual(55);
  });

  it('usa preço default para produto fora dos casos conhecidos', async () => {
    const sessao = makeSessao({ contexto: { produto: 'Outro Produto' } });
    const r = await calcularOrcamentoHandler.handle('', sessao, makeDeps());
    expect(r.updatedContext.orcamento?.total).toBeGreaterThan(0);
  });
});
