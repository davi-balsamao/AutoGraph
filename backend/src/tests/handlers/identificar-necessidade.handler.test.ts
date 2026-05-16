import { ConversationState } from '../../fsm/states';
import { makeDeps, makeEntities, makeRagMock, makeSessao } from './helpers';

jest.mock('../../services/entity-extraction.service', () => ({
  entityExtractionService: {
    extract: jest.fn(),
    identificarProdutoNaMensagem: jest.fn(),
  },
}));

const { identificarNecessidadeHandler } = require('../../fsm/handlers/identificar-necessidade.handler');
const { entityExtractionService } = require('../../services/entity-extraction.service');

describe('IdentificarNecessidadeHandler', () => {
  beforeEach(() => {
    (entityExtractionService.extract as jest.Mock).mockResolvedValue(makeEntities());
    (entityExtractionService.identificarProdutoNaMensagem as jest.Mock).mockReturnValue(null);
  });

  it('desvia para ESCLARECER_DUVIDA em pergunta técnica', async () => {
    const sessao = makeSessao({ estadoAtual: 'IDENTIFICAR_NECESSIDADE' });
    const rag = makeRagMock('A diferença é o gramatura.');
    const r = await identificarNecessidadeHandler.handle(
      'qual a diferença entre panfleto e flyer?',
      sessao,
      makeDeps({ ragService: rag })
    );
    expect(r.nextState).toBe(ConversationState.ESCLARECER_DUVIDA);
    expect(rag.queryWithState).toHaveBeenCalled();
  });

  it('avança para COLETAR_ESPECIFICACOES quando cliente menciona produto explícito', async () => {
    (entityExtractionService.identificarProdutoNaMensagem as jest.Mock).mockReturnValue({
      produto: 'Panfletos',
      descricao: 'x',
      requisitos_orcamento: ['Qual quantidade deseja?'],
    });
    (entityExtractionService.extract as jest.Mock).mockResolvedValue(
      makeEntities({
        produtoIdentificado: 'Panfletos',
        perguntasFaltantes: ['Qual quantidade deseja?'],
      })
    );

    const sessao = makeSessao({ estadoAtual: 'IDENTIFICAR_NECESSIDADE' });
    const r = await identificarNecessidadeHandler.handle(
      'quero panfletos',
      sessao,
      makeDeps()
    );
    expect(r.nextState).toBe(ConversationState.COLETAR_ESPECIFICACOES);
    expect(r.updatedContext.produto).toBe('Panfletos');
    expect(r.response).toMatch(/quantidade/i);
  });

  it('cai em RAG quando cliente diz algo genérico sem produto', async () => {
    const sessao = makeSessao({ estadoAtual: 'IDENTIFICAR_NECESSIDADE' });
    const rag = makeRagMock('Me conta qual material você precisa.');
    const r = await identificarNecessidadeHandler.handle(
      'preciso de algo impresso',
      sessao,
      makeDeps({ ragService: rag })
    );
    expect(rag.queryWithState).toHaveBeenCalled();
    expect(r.response).toBe('Me conta qual material você precisa.');
  });

  it('Fluxo 5: trata pergunta de preço antes das specs como DUVIDA → ESCLARECER_DUVIDA', async () => {
    // Cliente menciona produto MAS está pedindo preço sem fornecer specs.
    // A DUVIDA expandida (transition.service.ts) cobre "preço/quanto custa/preciso saber"
    // e o handler desvia para ESCLARECER_DUVIDA antes de cair na rota de produto.
    (entityExtractionService.identificarProdutoNaMensagem as jest.Mock).mockReturnValue({
      produto: 'Panfletos',
      descricao: 'x',
      requisitos_orcamento: ['Qual quantidade deseja?'],
    });

    const sessao = makeSessao({ estadoAtual: 'IDENTIFICAR_NECESSIDADE' });
    const rag = makeRagMock('Preciso de algumas informações antes de calcular o preço.');
    const r = await identificarNecessidadeHandler.handle(
      'Preciso saber o preço de 1000 panfletos, me diz logo.',
      sessao,
      makeDeps({ ragService: rag })
    );

    expect(r.nextState).toBe(ConversationState.ESCLARECER_DUVIDA);
    expect(rag.queryWithState).toHaveBeenCalled();
  });
});
