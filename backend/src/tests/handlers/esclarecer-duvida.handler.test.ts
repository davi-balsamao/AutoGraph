import { ConversationState } from '../../fsm/states';
import { makeDeps, makeEntities, makeRagMock, makeSessao } from './helpers';

jest.mock('../../services/entity-extraction.service', () => ({
  entityExtractionService: {
    extract: jest.fn(),
    extractRegex: jest.fn(),
    identificarProdutoNaMensagem: jest.fn(),
  },
}));

const { esclarecerDuvidaHandler } = require('../../fsm/handlers/esclarecer-duvida.handler');
const { entityExtractionService } = require('../../services/entity-extraction.service');

describe('EsclarecerDuvidaHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const entities = makeEntities();

    (entityExtractionService.extract as jest.Mock).mockResolvedValue(entities);
    (entityExtractionService.extractRegex as jest.Mock).mockReturnValue(entities);
    (entityExtractionService.identificarProdutoNaMensagem as jest.Mock).mockReturnValue(null);
  });

  it('permanece em ESCLARECER_DUVIDA enquanto cliente pergunta', async () => {
    const sessao = makeSessao({
      estadoAtual: 'ESCLARECER_DUVIDA',
      estadoAnterior: 'IDENTIFICAR_NECESSIDADE',
    });

    const rag = makeRagMock('Panfletos são folhetos para divulgação.');

    const r = await esclarecerDuvidaHandler.handle(
      'O que são panfletos?',
      sessao,
      makeDeps({ ragService: rag })
    );

    expect(r.nextState).toBe(ConversationState.ESCLARECER_DUVIDA);
    expect(r.response).toBeTruthy();
  });

  it('sai para estado anterior quando cliente sinaliza progresso sem produto', async () => {
    const sessao = makeSessao({
      estadoAtual: 'ESCLARECER_DUVIDA',
      estadoAnterior: 'IDENTIFICAR_NECESSIDADE',
    });

    const r = await esclarecerDuvidaHandler.handle('Entendi, obrigado!', sessao, makeDeps());

    expect(r.nextState).toBe(ConversationState.IDENTIFICAR_NECESSIDADE);
    expect(r.chainNext).toBe(ConversationState.IDENTIFICAR_NECESSIDADE);
  });

  it('promove para COLETAR_ESPECIFICACOES quando há produto e cliente avança', async () => {
    const entities = makeEntities({
      produtoIdentificado: 'Panfletos',
    });

    (entityExtractionService.extract as jest.Mock).mockResolvedValue(entities);
    (entityExtractionService.extractRegex as jest.Mock).mockReturnValue(entities);

    const sessao = makeSessao({
      estadoAtual: 'ESCLARECER_DUVIDA',
      estadoAnterior: 'IDENTIFICAR_NECESSIDADE',
      contexto: {
        produto: 'Panfletos',
      },
    });

    const r = await esclarecerDuvidaHandler.handle('Vou de panfleto então', sessao, makeDeps());

    expect(r.nextState).toBe(ConversationState.COLETAR_ESPECIFICACOES);
    expect(r.chainNext).toBe(ConversationState.COLETAR_ESPECIFICACOES);
  });
});