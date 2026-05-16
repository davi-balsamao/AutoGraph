import { ConversationState } from '../../fsm/states';
import { makeDeps, makeEntities, makeRagMock, makeSessao } from './helpers';

jest.mock('../../services/entity-extraction.service', () => ({
  entityExtractionService: {
    extract: jest.fn(),
    identificarProdutoNaMensagem: jest.fn(),
  },
}));

const { negociarHandler } = require('../../fsm/handlers/negociar.handler');
const { entityExtractionService } = require('../../services/entity-extraction.service');

describe('NegociarHandler', () => {
  beforeEach(() => {
    (entityExtractionService.extract as jest.Mock).mockResolvedValue(makeEntities());
  });

  it('escala para ESCALAR_HUMANO quando cliente exige desconto acima da margem', async () => {
    // Total R$ 700 → margem máxima 10%. Cliente pede 40%.
    const sessao = makeSessao({
      contexto: { produto: 'Banner ou Lona', orcamento: { total: 700, prazo: '3 dias', validade: '3 dias' } },
    });
    const r = await negociarHandler.handle('Quero 40% de desconto!', sessao, makeDeps());
    expect(r.chainNext).toBe(ConversationState.ESCALAR_HUMANO);
  });

  it('NÃO escala quando desconto pedido está dentro da margem', async () => {
    // Total R$ 700 → margem máxima 10%. Cliente pede 8%.
    const sessao = makeSessao({
      contexto: { produto: 'Banner ou Lona', orcamento: { total: 700, prazo: '3 dias', validade: '3 dias' } },
    });
    const rag = makeRagMock('Posso fechar com 8% no Pix.');
    const r = await negociarHandler.handle(
      'Consegue 8% de desconto?',
      sessao,
      makeDeps({ ragService: rag })
    );
    expect(r.chainNext).not.toBe(ConversationState.ESCALAR_HUMANO);
    expect(rag.queryWithState).toHaveBeenCalled();
  });

  it('encadeia para COLETAR_DADOS_ENTREGA quando cliente aceita após negociação', async () => {
    const sessao = makeSessao({
      contexto: { produto: 'Panfletos', orcamento: { total: 300, prazo: '3 dias', validade: '3 dias' } },
    });
    const r = await negociarHandler.handle('Ok, aceito esse valor.', sessao, makeDeps());
    expect(r.chainNext).toBe(ConversationState.COLETAR_DADOS_ENTREGA);
  });

  it('encadeia para ENCERRAR quando cliente recusa após negociação', async () => {
    const sessao = makeSessao({
      contexto: { produto: 'Panfletos', orcamento: { total: 300, prazo: '3 dias', validade: '3 dias' } },
    });
    const r = await negociarHandler.handle('não quero mais', sessao, makeDeps());
    expect(r.chainNext).toBe(ConversationState.ENCERRAR);
  });

  it('chama RAG e permanece em NEGOCIAR para mensagem aberta sem desconto explícito', async () => {
    const sessao = makeSessao({
      contexto: { produto: 'Panfletos', orcamento: { total: 300, prazo: '3 dias', validade: '3 dias' } },
    });
    const rag = makeRagMock('Posso ajustar o acabamento para reduzir.');
    const r = await negociarHandler.handle(
      'Ainda achei caro, tem outra opção?',
      sessao,
      makeDeps({ ragService: rag })
    );
    expect(r.nextState).toBe(ConversationState.NEGOCIAR);
    expect(rag.queryWithState).toHaveBeenCalled();
  });
});
