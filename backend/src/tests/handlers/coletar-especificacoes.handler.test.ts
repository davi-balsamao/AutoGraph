import { ConversationState } from '../../fsm/states';
import { makeDeps, makeEntities, makeRagMock, makeSessao } from './helpers';

jest.mock('../../services/entity-extraction.service', () => ({
  entityExtractionService: {
    extract: jest.fn(),
    identificarProdutoNaMensagem: jest.fn(),
  },
}));

const { coletarEspecificacoesHandler } = require('../../fsm/handlers/coletar-especificacoes.handler');
const { entityExtractionService } = require('../../services/entity-extraction.service');

describe('ColetarEspecificacoesHandler', () => {
  beforeEach(() => {
    (entityExtractionService.extract as jest.Mock).mockResolvedValue(makeEntities());
    (entityExtractionService.identificarProdutoNaMensagem as jest.Mock).mockReturnValue(null);
  });

  it('encadeia para CALCULAR_ORCAMENTO quando specs estão completas (produto sem arte)', async () => {
    (entityExtractionService.extract as jest.Mock).mockResolvedValue(
      makeEntities({
        produtoIdentificado: 'Apostila',
        completo: true,
      })
    );
    const sessao = makeSessao({
      estadoAtual: 'COLETAR_ESPECIFICACOES',
      contexto: { produto: 'Apostila', specsPendentes: [] },
    });
    const r = await coletarEspecificacoesHandler.handle(
      '50 páginas A4 frente e verso colorido com espiral',
      sessao,
      makeDeps()
    );
    expect(r.chainNext).toBe(ConversationState.CALCULAR_ORCAMENTO);
  });

  it('pede arquivo de arte ao completar specs de produto que exige arte', async () => {
    (entityExtractionService.extract as jest.Mock).mockResolvedValue(
      makeEntities({
        produtoIdentificado: 'Panfletos',
        completo: true,
        perguntasFaltantes: [],
      })
    );
    const sessao = makeSessao({
      estadoAtual: 'COLETAR_ESPECIFICACOES',
      contexto: { produto: 'Panfletos', specsPendentes: [] },
    });
    const r = await coletarEspecificacoesHandler.handle(
      '1000 unidades 10x14cm frente e verso',
      sessao,
      makeDeps()
    );
    expect(r.nextState).toBe(ConversationState.VALIDAR_ARQUIVO);
    expect(r.response).toMatch(/arquivo de arte/i);
  });

  it('pergunta a próxima spec quando há pendências', async () => {
    (entityExtractionService.extract as jest.Mock).mockResolvedValue(
      makeEntities({
        produtoIdentificado: 'Panfletos',
        completo: false,
        perguntasFaltantes: ['Qual quantidade deseja?'],
      })
    );
    const sessao = makeSessao({
      estadoAtual: 'COLETAR_ESPECIFICACOES',
      contexto: { produto: 'Panfletos' },
    });
    const r = await coletarEspecificacoesHandler.handle('quero panfletos', sessao, makeDeps());
    expect(r.nextState).toBe(ConversationState.COLETAR_ESPECIFICACOES);
    expect(r.response).toMatch(/quantidade/i);
  });

  it('aceita tamanho personalizado sem regredir', async () => {
    const sessao = makeSessao({
      estadoAtual: 'COLETAR_ESPECIFICACOES',
      contexto: { produto: 'Banner ou Lona' },
    });
    const r = await coletarEspecificacoesHandler.handle(
      'queria um tamanho maior, personalizado',
      sessao,
      makeDeps()
    );
    expect(r.response).toMatch(/tamanho.*personalizad|largura.*altura/i);
    expect(r.nextState).toBe(ConversationState.COLETAR_ESPECIFICACOES);
  });
});
