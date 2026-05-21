import { ConversationState } from '../../fsm/states';
import { makeDeps, makeEntities, makeSessao } from './helpers';

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
        perguntasFaltantes: [],
      })
    );

    const sessao = makeSessao({
      estadoAtual: 'COLETAR_ESPECIFICACOES',
      contexto: {
        produto: 'Apostila',
        specs: {
          'Qual quantidade deseja?': '10 unidades',
          'Quantas páginas?': '50 páginas',
          'Qual tamanho?': 'A4',
        },
        specsPendentes: [],
      },
    });

    const r = await coletarEspecificacoesHandler.handle(
      '50 páginas A4 frente e verso colorido com espiral',
      sessao,
      makeDeps()
    );

    expect(r.chainNext).toBe(ConversationState.CALCULAR_ORCAMENTO);
  });

  it('pede arte ao completar specs de produto que exige arte', async () => {
    (entityExtractionService.extract as jest.Mock).mockResolvedValue(
      makeEntities({
        produtoIdentificado: 'Panfletos',
        completo: true,
        perguntasFaltantes: [],
      })
    );

    const sessao = makeSessao({
      estadoAtual: 'COLETAR_ESPECIFICACOES',
      contexto: {
        produto: 'Panfletos',
        specs: {
          'Qual quantidade deseja?': '1000 unidades',
          'Qual será o tamanho (ex: 10x14cm, 15x21cm)?': '10x14cm',
          'A impressão será só frente ou frente e verso?': 'Frente e verso',
        },
        specsPendentes: [],
      },
    });

    const r = await coletarEspecificacoesHandler.handle(
      '1000 unidades 10x14cm frente e verso',
      sessao,
      makeDeps()
    );

    expect(r.nextState).toBe(ConversationState.VALIDAR_ARQUIVO);
    expect(r.response).toMatch(/arte pronta|arquivo de arte/i);
  });

  it('pergunta a próxima spec quando há pendência real', async () => {
    (entityExtractionService.extract as jest.Mock).mockResolvedValue(
      makeEntities({
        produtoIdentificado: 'Panfletos',
        completo: false,
        perguntasFaltantes: [
          'Qual quantidade deseja?',
          'Qual será o tamanho (ex: 10x14cm, 15x21cm)?',
          'A impressão será só frente ou frente e verso?',
        ],
      })
    );

    const sessao = makeSessao({
      estadoAtual: 'COLETAR_ESPECIFICACOES',
      contexto: {
        produto: 'Panfletos',
        specs: {},
        specsPendentes: [
          'Qual quantidade deseja?',
          'Qual será o tamanho (ex: 10x14cm, 15x21cm)?',
          'A impressão será só frente ou frente e verso?',
        ],
      },
    });

    const r = await coletarEspecificacoesHandler.handle(
      'quero panfletos',
      sessao,
      makeDeps()
    );

    expect(r.nextState).toBe(ConversationState.COLETAR_ESPECIFICACOES);
    expect(r.response).toMatch(/quantas unidades|quantidade/i);
  });

  it('aceita tamanho personalizado sem regredir', async () => {
    const sessao = makeSessao({
      estadoAtual: 'COLETAR_ESPECIFICACOES',
      contexto: {
        produto: 'Banner ou Lona',
        specs: {},
        specsPendentes: ['Qual o tamanho desejado (Largura x Altura)?'],
      },
    });

    const r = await coletarEspecificacoesHandler.handle(
      'queria um tamanho maior, personalizado',
      sessao,
      makeDeps()
    );

    expect(r.response).toMatch(/tamanho.*personalizad|largura.*altura/i);
    expect(r.nextState).toBe(ConversationState.COLETAR_ESPECIFICACOES);
  });

  it('ajusta quantidade mínima quando cliente aceita o mínimo', async () => {
    (entityExtractionService.extract as jest.Mock).mockResolvedValue(
      makeEntities({
        produtoIdentificado: 'Panfletos',
        completo: true,
        perguntasFaltantes: [],
      })
    );

    const sessao = makeSessao({
      estadoAtual: 'COLETAR_ESPECIFICACOES',
      contexto: {
        produto: 'Panfletos',
        specs: {
          'Qual quantidade deseja?': '20 unidades',
          'Qual será o tamanho (ex: 10x14cm, 15x21cm)?': 'A4',
          'A impressão será só frente ou frente e verso?': 'Frente e verso',
        },
        specsPendentes: ['__AJUSTE_QUANTIDADE_MINIMA__'],
      },
    });

    const r = await coletarEspecificacoesHandler.handle(
      'Pode sim',
      sessao,
      makeDeps()
    );

    expect(r.nextState).toBe(ConversationState.VALIDAR_ARQUIVO);
    expect(r.updatedContext.specs?.['Qual quantidade deseja?']).toBe('100 unidades');
    expect(r.response).toMatch(/arte pronta|arquivo de arte/i);
  });
});