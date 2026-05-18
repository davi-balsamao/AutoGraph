import { ConversationState } from '../../fsm/states';
import { makeDeps, makeEntities, makeSessao } from './helpers';

jest.mock('../../services/entity-extraction.service', () => ({
  entityExtractionService: {
    extract: jest.fn(),
    identificarProdutoNaMensagem: jest.fn(),
  },
}));

const { aguardarRetornoHandler } = require('../../fsm/handlers/aguardar-retorno.handler');
const { entityExtractionService } = require('../../services/entity-extraction.service');

describe('AguardarRetornoHandler', () => {
  beforeEach(() => {
    (entityExtractionService.extract as jest.Mock).mockResolvedValue(makeEntities());
    (entityExtractionService.identificarProdutoNaMensagem as jest.Mock).mockReturnValue(null);
  });

  it('encadeia para COLETAR_ESPECIFICACOES quando cliente menciona produto válido', async () => {
    (entityExtractionService.identificarProdutoNaMensagem as jest.Mock).mockReturnValue({
      produto: 'Cartão de Visita',
      descricao: 'x',
      requisitos_orcamento: [],
    });

    const sessao = makeSessao({ estadoAnterior: 'IDENTIFICAR_NECESSIDADE' });
    const r = await aguardarRetornoHandler.handle('voltei, quero cartões de visita', sessao, makeDeps());

    expect(r.chainNext).toBe(ConversationState.COLETAR_ESPECIFICACOES);
    expect(r.updatedContext.produto).toBe('Cartão de Visita');
  });

  it('restaura estado anterior para mensagem genérica', async () => {
    const sessao = makeSessao({ estadoAnterior: 'COLETAR_ESPECIFICACOES' });
    const r = await aguardarRetornoHandler.handle('oi, voltei', sessao, makeDeps());
    expect(r.nextState).toBe(ConversationState.COLETAR_ESPECIFICACOES);
    expect(r.response).toMatch(/voltou/i);
  });

  it('cai em IDENTIFICAR_NECESSIDADE quando não há estadoAnterior', async () => {
    const sessao = makeSessao({ estadoAnterior: null });
    const r = await aguardarRetornoHandler.handle('oi', sessao, makeDeps());
    expect(r.nextState).toBe(ConversationState.IDENTIFICAR_NECESSIDADE);
  });

  it('permanece em AGUARDAR_RETORNO para mensagem vazia (lembrete enviado pelo cron)', async () => {
    const sessao = makeSessao();
    const r = await aguardarRetornoHandler.handle('', sessao, makeDeps());
    expect(r.nextState).toBe(ConversationState.AGUARDAR_RETORNO);
    expect(r.response).toBe('');
  });
});
