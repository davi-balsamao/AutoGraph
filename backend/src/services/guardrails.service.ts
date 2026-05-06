import { Document } from '@langchain/core/documents';

export interface ValidationResult {
  isValid: boolean;
  correctedResponse?: string;
  reason?: string;
  isOutOfScope?: boolean;
}

export class GuardrailsService {
  // Termos esperados em conversas relacionadas a uma gráfica
  private allowedTopics = [
    'produto', 'preço', 'prazo', 'material', 'gráfica', 'impressão', 'banner',
    'cartão', 'panfleto', 'adesivo', 'arte', 'design', 'milheiro', 'cento', 'gramatura',
    'verniz', 'fosco', 'brilho', 'tamanho', 'cores', 'orçamento'
  ];

  private outOfScopeMessage = 'Desculpe, como assistente da AutoGraph, só posso ajudar com informações sobre nossos produtos gráficos, preços, prazos e materiais de impressão. Como posso ajudar com seu projeto gráfico?';

  /**
   * Valida a resposta gerada pela IA contra os documentos recuperados
   */
  public validateResponse(response: string, retrievedDocs: Document[]): ValidationResult {
    // 1. Validação de Escopo
    if (this.isOutOfScope(response)) {
      console.warn('🚨 [Guardrails] Resposta bloqueada: Fora do escopo.');
      return { 
        isValid: false, 
        isOutOfScope: true, 
        correctedResponse: this.outOfScopeMessage, 
        reason: 'Out of scope content detected' 
      };
    }

    // 2. Proibição de Preços (Anti-alucinação / Regra de Negócio)
    // A IA NUNCA deve dar preços, sob nenhuma hipótese.
    const generatedPrices = this.extractPrices(response);
    
    if (generatedPrices.length > 0) {
      console.warn(`🚨 [Guardrails] Alucinação/Violação detectada! A IA tentou fornecer um preço (ex: R$ ${generatedPrices[0]}).`);
      return {
        isValid: false,
        reason: `IA tentou fornecer valores financeiros.`,
        correctedResponse: 'Anotei todas as informações! Como nossos preços variam de acordo com as especificações da arte e do pedido, vou repassar seus dados para a nossa recepcionista. Ela vai gerar o seu orçamento exato e falará com você em breve.'
      };
    }

    console.info('✅ [Guardrails] Resposta validada com sucesso.');

    return { isValid: true };
  }

  /**
   * Avalia de forma heurística se a resposta gerada fugiu do contexto da gráfica.
   * Obs: Uma resposta de saudação ("Olá, tudo bem?") não deve ser bloqueada.
   */
  private isOutOfScope(response: string): boolean {
    const lowerResponse = response.toLowerCase();
    
    // Lista de palavras que ativam um bloqueio imediato (negativadas)
    const negativeTopics = [
        'previsão do tempo', 'receita de bolo', 'futebol', 'política',
        'religião', 'piada', 'quem é o presidente', 'como fazer'
    ];

    for (const topic of negativeTopics) {
        if (lowerResponse.includes(topic)) {
            return true;
        }
    }

    // Se a resposta for longa (ex: mais de 100 caracteres) e não contiver nenhum termo gráfico,
    // há uma chance de estar fora do escopo. Respostas curtas (saudações) passam livremente.
    if (response.length > 100) {
      let hasTopic = false;
      for (const topic of this.allowedTopics) {
        if (lowerResponse.includes(topic)) {
          hasTopic = true;
          break;
        }
      }
      if (!hasTopic) {
         // Resposta longa sem nenhuma palavra do contexto gráfico -> provável alucinação/fora do escopo
         return true;
      }
    }

    return false;
  }

  public extractPrices(text: string): number[] {
    const prices: number[] = [];
    
    // Regex 1: Prefixos monetários (R$, RS, $, US$)
    const regexPrefix = /(?:R\$|RS|\$|US\$)\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/gi;
    
    // Regex 2: Sufixos monetários (reais, real, dólares)
    const regexSuffix = /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)\s*(?:reais|real|dólares)/gi;
    
    // Regex 3: Palavras-chave de valor
    const regexKeywords = /(?:custa|valor|preço|orçamento)[^\d]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/gi;

    const extractAndPush = (regex: RegExp) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        const priceStr = match[1].replace(/\./g, '').replace(',', '.');
        prices.push(parseFloat(priceStr));
      }
    };

    extractAndPush(regexPrefix);
    extractAndPush(regexSuffix);
    extractAndPush(regexKeywords);
    
    return prices;
  }


}

export const guardrailsService = new GuardrailsService();
