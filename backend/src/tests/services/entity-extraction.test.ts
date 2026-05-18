/**
 * Testes do EntityExtractionService.
 *
 * Foco: caminho híbrido (LLM-first + fallback regex), cache e mapeamento
 * do resultado do LLM em PedidoEntities respeitando o catálogo.
 *
 * O LLM é totalmente mockado — não há chamada real ao Gemini aqui.
 */

import { LlmExtractResult } from '../../services/llm-entity-extractor.service';

// Mock manual do serviço LLM: o cache do EntityExtractionService NÃO é compartilhado
// entre testes porque ele é módulo-level. Resetamos com jest.resetModules() quando
// precisamos garantir isolamento.

function makeLlmMock(result: Partial<LlmExtractResult> | Error) {
  const extract = jest.fn(async () => {
    if (result instanceof Error) throw result;
    return {
      produtoIdentificado: null,
      produtoDesconhecido: false,
      intent: 'OUTRO',
      specs: {},
      resolveuReferencia: null,
      ...result,
    } as LlmExtractResult;
  });
  return {
    extract,
    instance: { extract } as any,
  };
}

describe('EntityExtractionService — caminho LLM', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('mapeia produtoIdentificado + specs do LLM para PedidoEntities', async () => {
    const llmMock = makeLlmMock({
      produtoIdentificado: 'Panfletos',
      intent: 'NOVO_PEDIDO',
      specs: {
        'Qual quantidade deseja?': '1000 unidades',
        'Qual será o tamanho (ex: 10x14cm, 15x21cm)?': '10x14cm',
        'A impressão será só frente ou frente e verso?': 'frente e verso',
      },
    });

    jest.doMock('../../services/llm-entity-extractor.service', () => ({
      llmEntityExtractor: llmMock.instance,
      LlmEntityExtractor: class {},
    }));

    const { entityExtractionService } = await import('../../services/entity-extraction.service');
    const r = await entityExtractionService.extract('Cliente: quero 1000 panfletos 10x14cm frente e verso');

    expect(r.produtoIdentificado).toBe('Panfletos');
    expect(r.completo).toBe(true);
    expect(r.requisitos.find((req) => req.pergunta.includes('quantidade'))?.resposta).toBe('1000 unidades');
    expect(r.intent).toBe('NOVO_PEDIDO');
  });

  it('marca produtoDesconhecido sem produto válido no catálogo', async () => {
    const llmMock = makeLlmMock({
      produtoIdentificado: null,
      produtoDesconhecido: true,
      intent: 'NOVO_PEDIDO',
    });

    jest.doMock('../../services/llm-entity-extractor.service', () => ({
      llmEntityExtractor: llmMock.instance,
      LlmEntityExtractor: class {},
    }));

    const { entityExtractionService } = await import('../../services/entity-extraction.service');
    const r = await entityExtractionService.extract('Cliente: quero imprimir camisetas');
    expect(r.produtoIdentificado).toBeNull();
    expect(r.produtoDesconhecido).toBe(true);
  });

  it('respeita produtoTravado em options.produtoAtual', async () => {
    const llmMock = makeLlmMock({
      produtoIdentificado: 'Banner ou Lona', // LLM inferiu outro
      intent: 'OUTRO',
      specs: { 'Qual o tamanho desejado (Largura x Altura)?': '2x1m' },
    });

    jest.doMock('../../services/llm-entity-extractor.service', () => ({
      llmEntityExtractor: llmMock.instance,
      LlmEntityExtractor: class {},
    }));

    const { entityExtractionService } = await import('../../services/entity-extraction.service');
    const r = await entityExtractionService.extract('Cliente: 200x100cm', {
      produtoAtual: 'Banner ou Lona',
    });

    expect(r.produtoIdentificado).toBe('Banner ou Lona');
  });
});

describe('EntityExtractionService — fallback regex', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('cai no regex quando LLM lança erro', async () => {
    const llmMock = makeLlmMock(new Error('timeout simulado'));

    jest.doMock('../../services/llm-entity-extractor.service', () => ({
      llmEntityExtractor: llmMock.instance,
      LlmEntityExtractor: class {},
    }));

    const { entityExtractionService } = await import('../../services/entity-extraction.service');
    const r = await entityExtractionService.extract(
      'Cliente: quero panfletos\nCliente: 500 unidades'
    );

    // Sem o LLM, o regex identifica panfletos via sinônimos.
    expect(r.produtoIdentificado).toBe('Panfletos');
    expect(llmMock.extract).toHaveBeenCalledTimes(1);
  });
});

describe('EntityExtractionService — cache', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('reusa resultado quando histórico e produto repetem', async () => {
    const llmMock = makeLlmMock({
      produtoIdentificado: 'Panfletos',
      intent: 'NOVO_PEDIDO',
      specs: { 'Qual quantidade deseja?': '500 unidades' },
    });

    jest.doMock('../../services/llm-entity-extractor.service', () => ({
      llmEntityExtractor: llmMock.instance,
      LlmEntityExtractor: class {},
    }));

    const { entityExtractionService } = await import('../../services/entity-extraction.service');
    const historico = 'Cliente: quero 500 panfletos';

    await entityExtractionService.extract(historico, { produtoAtual: 'Panfletos' });
    await entityExtractionService.extract(historico, { produtoAtual: 'Panfletos' });
    await entityExtractionService.extract(historico, { produtoAtual: 'Panfletos' });

    expect(llmMock.extract).toHaveBeenCalledTimes(1);
  });

  it('chama LLM novamente quando histórico muda', async () => {
    const llmMock = makeLlmMock({
      produtoIdentificado: 'Panfletos',
      intent: 'NOVO_PEDIDO',
      specs: {},
    });

    jest.doMock('../../services/llm-entity-extractor.service', () => ({
      llmEntityExtractor: llmMock.instance,
      LlmEntityExtractor: class {},
    }));

    const { entityExtractionService } = await import('../../services/entity-extraction.service');

    await entityExtractionService.extract('Cliente: oi', { produtoAtual: null });
    await entityExtractionService.extract('Cliente: oi\nCliente: quero panfletos', { produtoAtual: null });

    expect(llmMock.extract).toHaveBeenCalledTimes(2);
  });
});

describe('EntityExtractionService — identificarProdutoNaMensagem (regex, sem LLM)', () => {
  it('identifica panfletos via sinônimo', async () => {
    const { entityExtractionService } = await import('../../services/entity-extraction.service');
    const item = entityExtractionService.identificarProdutoNaMensagem('quero flyers para um show');
    expect(item?.produto).toBe('Panfletos');
  });

  it('retorna null para mensagem sem produto', async () => {
    const { entityExtractionService } = await import('../../services/entity-extraction.service');
    expect(entityExtractionService.identificarProdutoNaMensagem('oi tudo bem')).toBeNull();
  });
});
