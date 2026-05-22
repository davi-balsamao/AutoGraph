import { ConversationState } from '../../fsm/states';
import { makeDeps, makeEntities, makeRagMock, makeSessao } from './helpers';

jest.mock('../../services/entity-extraction.service', () => ({
  entityExtractionService: {
    extract: jest.fn(),
    identificarProdutoNaMensagem: jest.fn(),
  },
}));

const { aguardarAprovacaoHandler } = require('../../fsm/handlers/aguardar-aprovacao.handler');
const { entityExtractionService } = require('../../services/entity-extraction.service');

describe('AguardarAprovacaoHandler', () => {
  beforeEach(() => {
    (entityExtractionService.extract as jest.Mock).mockResolvedValue(makeEntities());
  });

  const ctx = {
    produto: 'Panfletos',
    orcamento: { total: 300, prazo: '3 dias úteis', validade: '3 dias úteis' },
  };

  it('encadeia para COLETAR_DADOS_ENTREGA ao detectar aprovação', async () => {
    const sessao = makeSessao({ contexto: ctx });
    const r = await aguardarAprovacaoHandler.handle('Aprovado!', sessao, makeDeps());
    expect(r.chainNext).toBe(ConversationState.COLETAR_DADOS_ENTREGA);
    expect(r.response).toBe('');
  });

  it('encadeia para NEGOCIAR ao detectar objeção de preço', async () => {
    const sessao = makeSessao({ contexto: ctx });
    const r = await aguardarAprovacaoHandler.handle(
      'tá caro demais, tem desconto?',
      sessao,
      makeDeps()
    );
    expect(r.chainNext).toBe(ConversationState.NEGOCIAR);
  });

  it('encadeia para ESCLARECER_DUVIDA ao detectar dúvida', async () => {
    const sessao = makeSessao({ contexto: ctx });
    const r = await aguardarAprovacaoHandler.handle(
      'qual a diferença para o outro produto?',
      sessao,
      makeDeps()
    );
    expect(r.chainNext).toBe(ConversationState.ESCLARECER_DUVIDA);
  });

  it('encadeia para ENCERRAR ao detectar recusa', async () => {
    const sessao = makeSessao({ contexto: ctx });
    const r = await aguardarAprovacaoHandler.handle('cancela tudo', sessao, makeDeps());
    expect(r.chainNext).toBe(ConversationState.ENCERRAR);
  });

  it('chama RAG quando sinal do cliente é ambíguo (sem repetir orçamento)', async () => {
    const sessao = makeSessao({ contexto: ctx });
    const rag = makeRagMock('Posso te ajudar com algo mais sobre o orçamento?');
    const r = await aguardarAprovacaoHandler.handle('vou ver com meu sócio', sessao, makeDeps({ ragService: rag }));

    expect(r.nextState).toBe(ConversationState.AGUARDAR_APROVACAO);
    expect(r.chainNext).toBeUndefined();
    expect(rag.queryWithState).toHaveBeenCalled();
  });
});
