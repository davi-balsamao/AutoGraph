import { ConversationState } from '../../fsm/states';
import { makeDeps, makeEntities, makeSessao } from './helpers';

jest.mock('../../services/entity-extraction.service', () => ({
  entityExtractionService: {
    extract: jest.fn(),
    identificarProdutoNaMensagem: jest.fn(),
  },
}));

const { validarArquivoHandler } = require('../../fsm/handlers/validar-arquivo.handler');
const { entityExtractionService } = require('../../services/entity-extraction.service');

describe('ValidarArquivoHandler', () => {
  beforeEach(() => {
    (entityExtractionService.extract as jest.Mock).mockResolvedValue(makeEntities());
  });

  it('encadeia para CALCULAR quando cliente confirma ter a arte', async () => {
    const sessao = makeSessao({ contexto: { produto: 'Panfletos' } });
    const r = await validarArquivoHandler.handle(
      'Sim, tenho o arquivo pronto em PDF',
      sessao,
      makeDeps()
    );
    expect(r.chainNext).toBe(ConversationState.CALCULAR_ORCAMENTO);
    expect(r.updatedContext.validacaoArteOk).toBe(true);
  });

  it('orienta e permanece quando cliente não tem arte', async () => {
    const sessao = makeSessao({ contexto: { produto: 'Panfletos' } });
    const r = await validarArquivoHandler.handle('Não tenho arte ainda', sessao, makeDeps());
    expect(r.nextState).toBe(ConversationState.VALIDAR_ARQUIVO);
    expect(r.response).toMatch(/designer|canva/i);
    expect(r.response).toMatch(/pdf|jpg|png|tiff/i);
  });

  it('transita para AGUARDAR_RETORNO quando cliente vai enviar depois', async () => {
    const sessao = makeSessao({ contexto: { produto: 'Panfletos' } });
    const r = await validarArquivoHandler.handle('Te mando depois', sessao, makeDeps());
    expect(r.nextState).toBe(ConversationState.AGUARDAR_RETORNO);
  });

  it('re-pergunta para mensagem ambígua', async () => {
    const sessao = makeSessao({ contexto: { produto: 'Panfletos' } });
    const r = await validarArquivoHandler.handle('beleza', sessao, makeDeps());
    expect(r.nextState).toBe(ConversationState.VALIDAR_ARQUIVO);
    expect(r.response).toMatch(/arquivo de arte/i);
  });
});
