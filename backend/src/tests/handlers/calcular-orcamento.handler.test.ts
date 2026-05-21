import { ConversationState } from '../../fsm/states';
import { calcularOrcamentoHandler } from '../../fsm/handlers/calcular-orcamento.handler';
import { makeDeps, makeSessao } from './helpers';

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
    (PricingReadAdapter.calcular as jest.Mock).mockResolvedValue(1200);

    const sessao = makeSessao({
      contexto: {
        produto: 'Panfletos',
        specs: {
          'Qual quantidade deseja?': '1000 unidades',
        },
      },
    });

    const r = await calcularOrcamentoHandler.handle('', sessao, makeDeps());

    expect(PricingReadAdapter.calcular).toHaveBeenCalledWith({
      produtoNome: 'Panfletos',
      quantidade: 1000,
      acabamento: undefined,
      specs: {
        'Qual quantidade deseja?': '1000 unidades',
      },
    });

    expect(r.chainNext).toBe(ConversationState.AGUARDAR_APROVACAO_ADMIN);
    expect(r.nextState).toBe(ConversationState.AGUARDAR_APROVACAO_ADMIN);
    expect(r.response).toBe('');

    expect(r.updatedContext.orcamento?.total).toBe(1200);
    expect(r.updatedContext.orcamento?.prazo).toBeTruthy();
    expect(r.updatedContext.orcamento?.validade).toBeTruthy();
  });

  it('quando aprovação admin está desativada, encadeia direto para apresentar orçamento', async () => {
    process.env.ADMIN_APPROVAL_REQUIRED = 'false';
    (PricingReadAdapter.calcular as jest.Mock).mockResolvedValue(750);

    const sessao = makeSessao({
      contexto: {
        produto: 'Cartão de Visita',
        specs: {
          'Qual quantidade deseja?': '1000 unidades',
        },
      },
    });

    const r = await calcularOrcamentoHandler.handle('', sessao, makeDeps());

    expect(r.chainNext).toBe(ConversationState.APRESENTAR_ORCAMENTO);
    expect(r.nextState).toBe(ConversationState.APRESENTAR_ORCAMENTO);
    expect(r.updatedContext.orcamento?.total).toBe(750);
  });

  it('retorna erro controlado quando quantidade não foi identificada', async () => {
    const sessao = makeSessao({
      contexto: {
        produto: 'Outro Produto',
      },
    });

    const r = await calcularOrcamentoHandler.handle('', sessao, makeDeps());

    expect(PricingReadAdapter.calcular).not.toHaveBeenCalled();
    expect(r.nextState).toBe(ConversationState.ESCLARECER_DUVIDA);
    expect(r.response).toMatch(/não consegui calcular/i);
    expect(r.updatedContext.orcamento).toBeUndefined();
  });

  it('retorna erro controlado quando adapter não encontra produto no catálogo', async () => {
    (PricingReadAdapter.calcular as jest.Mock).mockRejectedValue(
      new Error('Produto não encontrado no catálogo.')
    );

    const sessao = makeSessao({
      contexto: {
        produto: 'Produto Inexistente',
        specs: {
          'Qual quantidade deseja?': '100 unidades',
        },
      },
    });

    const r = await calcularOrcamentoHandler.handle('', sessao, makeDeps());

    expect(PricingReadAdapter.calcular).toHaveBeenCalled();
    expect(r.nextState).toBe(ConversationState.ESCLARECER_DUVIDA);
    expect(r.response).toMatch(/não consegui calcular/i);
    expect(r.updatedContext.orcamento).toBeUndefined();
  });
});