import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationContext, ConversationState, SessaoRecord } from '../states';
import { PricingReadAdapter } from '../../adapters/pricing.adapter';

function normalizarTexto(valor: unknown): string {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[?:.\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function palavraNumeroParaNumero(valor: string): number | null {
  const texto = normalizarTexto(valor)
    .replace(/\bunidades?\b/g, '')
    .replace(/\bblocos?\b/g, '')
    .replace(/\bbanners?\b/g, '')
    .replace(/\bpanfletos?\b/g, '')
    .replace(/\bcartoes?\b/g, '')
    .trim();

  const mapa: Record<string, number> = {
    um: 1,
    uma: 1,
    dois: 2,
    duas: 2,
    tres: 3,
    três: 3,
    quatro: 4,
    cinco: 5,
    seis: 6,
    sete: 7,
    oito: 8,
    nove: 9,
    dez: 10,
    onze: 11,
    doze: 12,
    treze: 13,
    quatorze: 14,
    catorze: 14,
    quinze: 15,
    vinte: 20,
    trinta: 30,
    cinquenta: 50,
    cem: 100,
    cento: 100,
    mil: 1000,
  };

  return mapa[texto] ?? null;
}

function extrairNumeroDeQuantidade(valor: unknown): number {
  const texto = String(valor || '').trim();

  if (!texto) return 0;

  const numeroPorPalavra = palavraNumeroParaNumero(texto);
  if (numeroPorPalavra && numeroPorPalavra > 0) {
    return numeroPorPalavra;
  }

  const match = texto.match(/\b(\d{1,6})\b/);
  if (match) {
    const qtd = Number(match[1]);
    return qtd > 0 ? qtd : 0;
  }

  return 0;
}

function extrairQuantidade(specs: any): number {
  if (!specs) return 0;

  // Caso venha como specs.quantidade
  if (specs.quantidade) {
    const qtd = extrairNumeroDeQuantidade(specs.quantidade);
    if (qtd > 0) return qtd;
  }

  /**
   * Prioridade absoluta:
   * pegar somente a resposta da pergunta de quantidade.
   *
   * Isso evita o bug:
   * "Qual quantidade deseja?" = "Duas unidades"
   * "Quantas vias terá cada folha?" = "10 vias"
   *
   * Antes o fallback pegava 10, mas a quantidade correta é 2.
   */
  for (const [chave, valor] of Object.entries(specs)) {
    const chaveNorm = normalizarTexto(chave);

    if (
      chaveNorm.includes('quantidade') ||
      chaveNorm.includes('qtd') ||
      chaveNorm.includes('unidades')
    ) {
      const qtd = extrairNumeroDeQuantidade(valor);
      if (qtd > 0) return qtd;
    }
  }

  /**
   * Fallback controlado:
   * tenta achar quantidade em campos que NÃO sejam vias, tamanho, formato,
   * páginas, prazo ou acabamento.
   */
  for (const [chave, valor] of Object.entries(specs)) {
    const chaveNorm = normalizarTexto(chave);

    const campoNaoEhQuantidade =
      chaveNorm.includes('vias') ||
      chaveNorm.includes('tamanho') ||
      chaveNorm.includes('formato') ||
      chaveNorm.includes('pagina') ||
      chaveNorm.includes('páginas') ||
      chaveNorm.includes('prazo') ||
      chaveNorm.includes('acabamento') ||
      chaveNorm.includes('papel') ||
      chaveNorm.includes('cor') ||
      chaveNorm.includes('numerado') ||
      chaveNorm.includes('autocopiativo');

    if (campoNaoEhQuantidade) continue;

    const qtd = extrairNumeroDeQuantidade(valor);
    if (qtd > 0) return qtd;
  }

  return 0;
}

function extrairProduto(context: ConversationContext): string {
  if (context.produto && context.produto.trim().length > 0) {
    return context.produto;
  }

  const specs: any = context.specs || {};

  for (const [chave, valor] of Object.entries(specs)) {
    const chaveLower = chave.toLowerCase();
    const valorTexto = String(valor || '').trim();
    const valorLower = valorTexto.toLowerCase();

    if (
      chaveLower.includes('produto') ||
      chaveLower.includes('tipo de produto') ||
      valorLower.includes('cartão') ||
      valorLower.includes('cartao') ||
      valorLower.includes('panfleto') ||
      valorLower.includes('banner') ||
      valorLower.includes('lona') ||
      valorLower.includes('bloco') ||
      valorLower.includes('apostila')
    ) {
      if (valorTexto) return valorTexto;
    }
  }

  return '';
}

function extrairAcabamento(specs: any): string | undefined {
  if (!specs) return undefined;

  const valores = Object.values(specs)
    .map((v) =>
      String(v || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    )
    .join(' ');

  const negativo =
    /\b(nao|sem)\b.{0,30}\b(laminacao|lamina|verniz|fosco)\b/i.test(valores) ||
    /\b(laminacao|lamina|verniz|fosco)\b.{0,30}\b(nao|sem)\b/i.test(valores);

  if (negativo) return undefined;

  if (/\bfosco\b/i.test(valores)) return 'fosco';
  if (/\blaminacao\b|\blamina\b/i.test(valores)) return 'laminacao';
  if (/\bverniz\b/i.test(valores)) return 'verniz';

  return undefined;
}

export class CalcularOrcamentoHandler implements StateHandler {
  async handle(
    _message: string,
    sessao: SessaoRecord,
    _deps: HandlerDeps
  ): Promise<HandlerResult> {
    const context: ConversationContext = { ...sessao.contexto };

    try {
      const produtoNome = extrairProduto(context);
      const quantidade = extrairQuantidade(context.specs);
      const acabamento = extrairAcabamento(context.specs);

      console.log('🧮 [CALCULAR_ORCAMENTO] Dados extraídos:', {
        produtoNome,
        quantidade,
        acabamento,
        specs: context.specs,
      });

      if (!produtoNome) {
        throw new Error('Produto não identificado no contexto.');
      }

      if (!quantidade || quantidade <= 0) {
        throw new Error('Quantidade não identificada no contexto.');
      }

      const total = await PricingReadAdapter.calcular({
        produtoNome,
        quantidade,
        acabamento,
        specs: context.specs,
      });

      context.produto = produtoNome;
      context.orcamento = {
        total,
        prazo: '3 dias úteis',
        validade: '3 dias úteis',
        detalhes: `Estimativa para ${produtoNome}: R$ ${total.toFixed(2)}`,
      };

      const proximo =
        process.env.ADMIN_APPROVAL_REQUIRED === 'true'
          ? ConversationState.AGUARDAR_APROVACAO_ADMIN
          : ConversationState.APRESENTAR_ORCAMENTO;

      return {
        response: '',
        nextState: proximo,
        updatedContext: context,
        chainNext: proximo,
      };
    } catch (e) {
      console.error('Erro na Pipeline de Orçamento:', e);

      return {
        response: 'Desculpe, não consegui calcular o preço com os dados informados.',
        nextState: ConversationState.ESCLARECER_DUVIDA,
        updatedContext: context,
      };
    }
  }
}

export const calcularOrcamentoHandler = new CalcularOrcamentoHandler();