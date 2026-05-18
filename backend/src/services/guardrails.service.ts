import { Document } from '@langchain/core/documents';

export interface ValidationResult {
  isValid: boolean;
  correctedResponse?: string;
  reason?: string;
  isOutOfScope?: boolean;
}

const PRICE_TOLERANCE = 0.02;

const TRANSITION_NO_PRICE =
  'Já anotei tudo! Vou processar seu orçamento e enviar para a nossa equipe aprovar no sistema. Assim que liberado, te passo o valor aqui mesmo, ok?';

const HALLUCINATION_PRICE_MESSAGE =
  'Para te passar o valor correto, preciso confirmar todos os detalhes do pedido com base na nossa tabela. Pode me ajudar com as especificações que ainda faltam?';

export class GuardrailsService {
  private allowedTopics = [
    'produto', 'preço', 'prazo', 'material', 'gráfica', 'impressão', 'banner',
    'cartão', 'panfleto', 'adesivo', 'arte', 'design', 'milheiro', 'cento', 'gramatura',
    'verniz', 'fosco', 'brilho', 'tamanho', 'cores', 'orçamento', 'pix', 'desconto',
    'laminação', 'acabamento', 'sangria', 'papel', 'couché', 'offset', 'lona', 'vinil',
  ];

  private outOfScopeMessage =
    'Desculpe, como assistente da AutoGraph, só posso ajudar com informações sobre nossos produtos gráficos, preços, prazos e materiais de impressão. Como posso ajudar com seu projeto gráfico?';

  /**
   * Valida a resposta gerada pela IA contra os documentos recuperados.
   * Preços são permitidos quando fundamentados na KB (tabela) ou dentro das margens de negociação.
   */
  public validateResponse(response: string, retrievedDocs: Document[]): ValidationResult {
    if (this.isOutOfScope(response)) {
      console.warn('🚨 [Guardrails] Resposta bloqueada: Fora do escopo.');
      return {
        isValid: false,
        isOutOfScope: true,
        correctedResponse: this.outOfScopeMessage,
        reason: 'Out of scope content detected',
      };
    }

    const generatedPrices = this.extractPrices(response);

    if (generatedPrices.length === 0) {
      console.info('✅ [Guardrails] Resposta validada com sucesso.');
      return { isValid: true };
    }

    const authorizedPrices = this.extractAuthorizedPrices(retrievedDocs);

    if (authorizedPrices.length === 0) {
      console.warn('🚨 [Guardrails] Preço sem contexto da KB — bloqueado.');
      return {
        isValid: false,
        reason: 'Preço informado sem documentos de tabela no contexto.',
        correctedResponse: TRANSITION_NO_PRICE,
      };
    }

    const invalidPrices = generatedPrices.filter(
      (price) => !this.isPriceAuthorized(price, authorizedPrices)
    );

    if (invalidPrices.length > 0) {
      console.warn(
        `🚨 [Guardrails] Preço não autorizado (ex: R$ ${invalidPrices[0]}). Valores da KB: ${authorizedPrices.slice(0, 5).join(', ')}...`
      );
      return {
        isValid: false,
        reason: 'Preço não encontrado na tabela recuperada ou fora da margem de desconto.',
        correctedResponse: HALLUCINATION_PRICE_MESSAGE,
      };
    }

    console.info('✅ [Guardrails] Resposta validada com sucesso (preços conferidos na KB).');
    return { isValid: true };
  }

  private isOutOfScope(response: string): boolean {
    const lowerResponse = response.toLowerCase();

    const negativeTopics = [
      'previsão do tempo', 'receita de bolo', 'futebol', 'política',
      'religião', 'piada', 'quem é o presidente', 'como fazer',
    ];

    for (const topic of negativeTopics) {
      if (lowerResponse.includes(topic)) {
        return true;
      }
    }

    if (response.length > 100) {
      let hasTopic = false;
      for (const topic of this.allowedTopics) {
        if (lowerResponse.includes(topic)) {
          hasTopic = true;
          break;
        }
      }
      if (!hasTopic) {
        return true;
      }
    }

    return false;
  }

  /** Extrai valores monetários autorizados a partir dos chunks recuperados (tabela, diretrizes, etc.). */
  public extractAuthorizedPrices(retrievedDocs: Document[]): number[] {
    const prices = new Set<number>();
    for (const doc of retrievedDocs) {
      for (const price of this.extractPrices(doc.pageContent)) {
        prices.add(price);
      }
    }
    return Array.from(prices);
  }

  /**
   * Preço válido se coincide com a tabela ou é desconto dentro da margem (diretrizes_negociacao).
   */
  private isPriceAuthorized(price: number, authorizedPrices: number[]): boolean {
    for (const base of authorizedPrices) {
      if (Math.abs(price - base) <= PRICE_TOLERANCE) {
        return true;
      }

      const maxDiscountPct = this.getMaxDiscountPercent(base);
      if (maxDiscountPct === 0) {
        continue;
      }

      const minAllowed = base * (1 - maxDiscountPct / 100);
      if (price >= minAllowed - PRICE_TOLERANCE && price <= base + PRICE_TOLERANCE) {
        return true;
      }
    }

    return false;
  }

  /** Margens conforme diretrizes_negociacao.md (faixa pelo valor total do pedido). */
  private getMaxDiscountPercent(orderTotal: number): number {
    if (orderTotal < 200) return 0;
    if (orderTotal < 500) return 5;
    return 10;
  }

  public extractPrices(text: string): number[] {
    const prices: number[] = [];

    const regexPrefix = /(?:R\$|RS|\$|US\$)\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/gi;
    const regexSuffix = /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)\s*(?:reais|real|dólares)/gi;
    const regexKeywords = /(?:custa|valor|preço|orçamento)[^\d]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/gi;

    const extractAndPush = (regex: RegExp) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        const priceStr = match[1].replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(priceStr);
        if (!Number.isNaN(parsed)) {
          prices.push(parsed);
        }
      }
    };

    extractAndPush(regexPrefix);
    extractAndPush(regexSuffix);
    extractAndPush(regexKeywords);

    return prices;
  }
}

export const guardrailsService = new GuardrailsService();
