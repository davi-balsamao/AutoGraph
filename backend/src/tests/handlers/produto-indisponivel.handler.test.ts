import { ConversationState } from '../../fsm/states';
import { makeDeps, makeEntities, makeSessao } from './helpers';

jest.mock('../../services/entity-extraction.service', () => ({
  entityExtractionService: {
    extract: jest.fn(),
    identificarProdutoNaMensagem: jest.fn(),
  },
}));

const { produtoIndisponivelHandler } = require('../../fsm/handlers/produto-indisponivel.handler');
const { entityExtractionService } = require('../../services/entity-extraction.service');

describe('ProdutoIndisponivelHandler', () => {
  beforeEach(() => {
    (entityExtractionService.extract as jest.Mock).mockResolvedValue(makeEntities());
    (entityExtractionService.identificarProdutoNaMensagem as jest.Mock).mockReturnValue(null);
  });

  it('lista catálogo na entrada padrão', async () => {
    const sessao = makeSessao();
    const r = await produtoIndisponivelHandler.handle('Quero camisetas', sessao, makeDeps());
    expect(r.nextState).toBe(ConversationState.PRODUTO_INDISPONIVEL);
    expect(r.response).toMatch(/n[ãa]o est[áa] no nosso cat[áa]logo/i);
    expect(r.response).toMatch(/Panfletos|Cart[ãa]o|Banner|Apostila/);
  });

  it('encadeia para IDENTIFICAR_NECESSIDADE se cliente menciona produto válido', async () => {
    (entityExtractionService.identificarProdutoNaMensagem as jest.Mock).mockReturnValue({
      produto: 'Panfletos',
      descricao: 'x',
      requisitos_orcamento: [],
    });

    const sessao = makeSessao();
    const r = await produtoIndisponivelHandler.handle(
      'então quero panfletos',
      sessao,
      makeDeps()
    );
    expect(r.chainNext).toBe(ConversationState.IDENTIFICAR_NECESSIDADE);
  });

  it('encerra quando cliente recusa todas as alternativas', async () => {
    const sessao = makeSessao();
    const r = await produtoIndisponivelHandler.handle('Não quero nada disso, deixa pra lá', sessao, makeDeps());
    expect(r.nextState).toBe(ConversationState.ENCERRAR);
  });
});
