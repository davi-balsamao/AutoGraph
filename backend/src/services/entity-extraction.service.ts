/**
 * EntityExtractionService — Card 15: Pipeline de Extração de Entidades
 *
 * Serviço que analisa o histórico da conversa e extrai as entidades
 * (respostas) do cliente para os requisitos do produto identificado.
 *
 * Pipeline:
 *   Histórico → Identificação do Produto → Mapeamento de Requisitos →
 *   Extração de Respostas → Verificação de Completude
 *
 * Usa o catálogo (catalogo.json) como fonte de verdade para os requisitos
 * dinâmicos de cada produto.
 */

import * as fs from 'fs';
import * as path from 'path';

// --- Tipos ---

/** Item do catálogo com requisitos de orçamento. */
interface CatalogItem {
  produto: string;
  descricao: string;
  requisitos_orcamento: string[];
}

/** Status de um único requisito extraído. */
export interface RequisitoStatus {
  pergunta: string;
  resposta: string | null;
  preenchido: boolean;
}

/** Resultado completo da extração de entidades. */
export interface PedidoEntities {
  /** Produto identificado na conversa (ex: "Cartão de Visita") */
  produtoIdentificado: string | null;
  /** Se o produto não foi encontrado no catálogo */
  produtoDesconhecido: boolean;
  /** Status de cada requisito para o produto */
  requisitos: RequisitoStatus[];
  /** Se todos os requisitos estão preenchidos */
  completo: boolean;
  /** Lista das perguntas que ainda faltam responder */
  perguntasFaltantes: string[];
}

// --- Classe ---

export class EntityExtractionService {
  private catalogo: CatalogItem[];

  constructor() {
    const catalogoPath = path.join(__dirname, '../../data/catalogo.json');
    if (fs.existsSync(catalogoPath)) {
      const raw = fs.readFileSync(catalogoPath, 'utf8');
      this.catalogo = JSON.parse(raw);
    } else {
      console.warn('⚠️ [EntityExtraction] catalogo.json não encontrado. Extração desabilitada.');
      this.catalogo = [];
    }
  }

  /**
   * Identifica o produto desejado pelo cliente com base no texto da conversa.
   * Usa correspondência por palavras-chave do nome do produto.
   */
  private identificarProduto(texto: string): CatalogItem | null {
    const textoLower = texto.toLowerCase();

    // Mapeamento de sinônimos/variações comuns
    const sinonimos: Record<string, string[]> = {
      'Panfletos': ['panfleto', 'panfletos', 'flyer', 'flyers', 'folheto', 'folhetos'],
      'Cartão de Visita': ['cartão de visita', 'cartao de visita', 'cartões de visita', 'cartoes de visita', 'cartão', 'cartao'],
      'Blocos': ['bloco', 'blocos', 'talão', 'talao', 'talões', 'receituário', 'receituario'],
      'Banner ou Lona': ['banner', 'banners', 'lona', 'lonas', 'faixa', 'faixas'],
      'Apostila': ['apostila', 'apostilas', 'encadernação', 'encadernacao', 'manual', 'manuais'],
    };

    for (const item of this.catalogo) {
      const palavras = sinonimos[item.produto] || [item.produto.toLowerCase()];
      for (const palavra of palavras) {
        if (textoLower.includes(palavra)) {
          return item;
        }
      }
    }

    return null;
  }

  /**
   * Tenta extrair respostas do histórico da conversa para cada requisito.
   * Usa heurísticas simples de mapeamento (sem LLM, para funcionar sem API key).
   */
  private extrairRespostas(
    historico: string,
    requisitos: string[]
  ): RequisitoStatus[] {
    const textoLower = historico.toLowerCase();

    return requisitos.map((pergunta) => {
      const perguntaLower = pergunta.toLowerCase();
      let resposta: string | null = null;

      // Heurística: "arte pronta"
      if (perguntaLower.includes('arte pronta') || perguntaLower.includes('arte')) {
        if (textoLower.includes('sim') && textoLower.includes('arte')) {
          resposta = 'Sim, tem arte pronta';
        } else if (textoLower.includes('não') && textoLower.includes('arte') ||
                   textoLower.includes('nao') && textoLower.includes('arte')) {
          resposta = 'Não tem arte pronta';
        }
      }

      // Heurística: quantidade (busca números)
      if (perguntaLower.includes('quantidade') || perguntaLower.includes('quantas unidades')) {
        const match = textoLower.match(/(\d{2,})\s*(?:unidades|cartões|cartoes|panfletos|blocos|cópias|copias|und)?/);
        if (match) {
          resposta = `${match[1]} unidades`;
        }
      }

      // Heurística: tamanho
      if (perguntaLower.includes('tamanho') || perguntaLower.includes('qual o tamanho')) {
        const match = textoLower.match(/(\d+\s*x\s*\d+\s*(?:cm|mm)?|a4|a5|a3)/i);
        if (match) {
          resposta = match[1].toUpperCase();
        }
      }

      // Heurística: frente/verso
      if (perguntaLower.includes('frente') && perguntaLower.includes('verso')) {
        if (textoLower.includes('frente e verso')) {
          resposta = 'Frente e verso';
        } else if (textoLower.includes('só frente') || textoLower.includes('so frente')) {
          resposta = 'Só frente';
        }
      }

      // Heurística: verniz
      if (perguntaLower.includes('verniz total')) {
        if (textoLower.includes('verniz') && textoLower.includes('sim')) {
          resposta = 'Sim, com verniz total';
        } else if (textoLower.includes('verniz') && (textoLower.includes('não') || textoLower.includes('nao'))) {
          resposta = 'Sem verniz total';
        }
      }

      // Heurística: laminação
      if (perguntaLower.includes('laminação') || perguntaLower.includes('laminacao')) {
        if (textoLower.includes('laminação') || textoLower.includes('laminacao')) {
          resposta = 'Com laminação fosca';
        }
      }

      // Heurística: colorida/preto
      if (perguntaLower.includes('colorid') || perguntaLower.includes('preto')) {
        if (textoLower.includes('colorid')) {
          resposta = 'Colorida';
        } else if (textoLower.includes('preto') || textoLower.includes('p/b') || textoLower.includes('p&b')) {
          resposta = 'Preto e branco';
        }
      }

      // Heurística: vias
      if (perguntaLower.includes('vias')) {
        const match = textoLower.match(/(\d+)\s*vias?/);
        if (match) {
          resposta = `${match[1]} vias`;
        }
      }

      // Heurística: autocopiativo
      if (perguntaLower.includes('autocopiativo')) {
        if (textoLower.includes('autocopiativo') && textoLower.includes('sim')) {
          resposta = 'Sim, autocopiativo';
        }
      }

      // Heurística: numerado
      if (perguntaLower.includes('numerado')) {
        if (textoLower.includes('numerado') && textoLower.includes('sim')) {
          resposta = 'Sim, numerado';
        }
      }

      // Heurística: espiral
      if (perguntaLower.includes('espiral')) {
        if (textoLower.includes('espiral') && textoLower.includes('sim')) {
          resposta = 'Sim, com espiral';
        }
      }

      // Heurística: páginas
      if (perguntaLower.includes('páginas') || perguntaLower.includes('paginas')) {
        const match = textoLower.match(/(\d+)\s*p[aá]ginas?/);
        if (match) {
          resposta = `${match[1]} páginas`;
        }
      }

      return {
        pergunta,
        resposta,
        preenchido: resposta !== null,
      };
    });
  }

  /**
   * Extrai as entidades do pedido a partir do histórico completo da conversa.
   *
   * @param conversationHistory Texto completo da conversa (todas as mensagens concatenadas)
   * @returns Entidades extraídas com status de completude
   */
  extract(conversationHistory: string): PedidoEntities {
    // 1. Identificar o produto
    const produto = this.identificarProduto(conversationHistory);

    if (!produto) {
      return {
        produtoIdentificado: null,
        produtoDesconhecido: true,
        requisitos: [],
        completo: false,
        perguntasFaltantes: [],
      };
    }

    // 2. Extrair respostas para os requisitos do produto
    const requisitos = this.extrairRespostas(conversationHistory, produto.requisitos_orcamento);

    // 3. Verificar completude
    const perguntasFaltantes = requisitos
      .filter((r) => !r.preenchido)
      .map((r) => r.pergunta);

    const completo = perguntasFaltantes.length === 0;

    return {
      produtoIdentificado: produto.produto,
      produtoDesconhecido: false,
      requisitos,
      completo,
      perguntasFaltantes,
    };
  }

  /**
   * Retorna a lista de produtos disponíveis no catálogo.
   */
  getAvailableProducts(): string[] {
    return this.catalogo.map((item) => item.produto);
  }

  /**
   * Retorna os requisitos para um produto específico.
   */
  getRequirementsForProduct(productName: string): string[] | null {
    const item = this.catalogo.find(
      (i) => i.produto.toLowerCase() === productName.toLowerCase()
    );
    return item ? item.requisitos_orcamento : null;
  }
}

export const entityExtractionService = new EntityExtractionService();
