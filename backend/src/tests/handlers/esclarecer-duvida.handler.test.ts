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
    (entityExtractionService.extract as jest.Mock).mockResolvedValue(makeEntities());
    (entityExtractionService.extractRegex as jest.Mock).mockReturnValue(makeEntities());
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
  });

  it('sai para estado anterior quando cliente sinaliza progresso (sem produto)', async () => {
    const sessao = makeSessao({
      estadoAtual: 'ESCLARECER_DUVIDA',
      estadoAnterior: 'IDENTIFICAR_NECESSIDADE',
    });
    const r = await esclarecerDuvidaHandler.handle('Entendi, obrigado!', sessao, makeDeps());
    expect(r.nextState).toBe(ConversationState.IDENTIFICAR_NECESSIDADE);
  });

  it('promove para COLETAR_ESPECIFICACOES quando há produto e cliente avança', async () => {
    (entityExtractionService.extract as jest.Mock).mockResolvedValue(
      makeEntities({ produtoIdentificado: 'Panfletos' })
    );
    (entityExtractionService.extractRegex as jest.Mock).mockReturnValue(
      makeEntities({ produtoIdentificado: 'Panfletos' })
    );
    const sessao = makeSessao({
      estadoAtual: 'ESCLARECER_DUVIDA',
      estadoAnterior: 'IDENTIFICAR_NECESSIDADE',
      contexto: { produto: 'Panfletos' },
    });
    const r = await esclarecerDuvidaHandler.handle('Vou de panfleto então', sessao, makeDeps());
    expect(r.nextState).toBe(ConversationState.COLETAR_ESPECIFICACOES);
  });
});
