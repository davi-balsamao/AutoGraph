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

    // 2. Extração e Validação de Preços (Anti-alucinação)
    const generatedPrices = this.extractPrices(response);
    
    if (generatedPrices.length > 0) {
      const docPrices = this.extractPricesFromDocs(retrievedDocs);
      
      for (const price of generatedPrices) {
        if (!docPrices.includes(price)) {
          console.warn(`🚨 [Guardrails] Alucinação detectada! Preço gerado R$ ${price} não encontrado nos documentos.`);
          return {
            isValid: false,
            reason: `Preço R$ ${price} não encontrado na base de conhecimento.`,
            correctedResponse: 'Desculpe, identifiquei uma inconsistência nos valores gerados. Por favor, consulte nossa tabela de preços oficial ou converse com um de nossos atendentes para confirmar o valor.'
          };
        }
      }
      
      console.info('✅ [Guardrails] Preços gerados validados com sucesso contra a base de conhecimento.');
    }

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

  /**
   * Extrai todos os valores em reais (R$ X,XX) de um texto.
   */
  public extractPrices(text: string): number[] {
    // Regex para pegar valores após "R$" ou "RS"
    const regex = /(?:R\$|RS)\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/gi;
    const prices: number[] = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      // Normalizar: remover pontos de milhar e trocar vírgula por ponto
      const priceStr = match[1].replace(/\./g, '').replace(',', '.');
      prices.push(parseFloat(priceStr));
    }
    
    return prices;
  }

  /**
   * Extrai todos os valores monetários dos documentos do LangChain fornecidos.
   */
  private extractPricesFromDocs(docs: Document[]): number[] {
    const allText = docs.map(d => d.pageContent).join(' \n ');
    return this.extractPrices(allText);
  }
}

export const guardrailsService = new GuardrailsService();
