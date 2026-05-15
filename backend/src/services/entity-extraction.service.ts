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
export interface ExtractOptions {
  /** Produto já travado na sessão FSM — não re-inferir do histórico. */
  produtoAtual?: string | null;
}

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
  private regrasTecnicas: Record<string, any> = {};

  constructor() {
    const catalogoPath = path.join(__dirname, '../../data/catalogo.json');
    if (fs.existsSync(catalogoPath)) {
      const raw = fs.readFileSync(catalogoPath, 'utf8');
      this.catalogo = JSON.parse(raw);
    } else {
      console.warn('⚠️ [EntityExtraction] catalogo.json não encontrado. Extração desabilitada.');
      this.catalogo = [];
    }

    const regrasPath = path.join(__dirname, '../../data/catalogo_produtos.json');
    if (fs.existsSync(regrasPath)) {
      const rawRegras = fs.readFileSync(regrasPath, 'utf8');
      this.regrasTecnicas = JSON.parse(rawRegras);
    } else {
      console.warn('⚠️ [EntityExtraction] catalogo_produtos.json não encontrado.');
    }
  }

  private readonly sinonimos: Record<string, string[]> = {
    'Panfletos': ['panfleto', 'panfletos', 'flyer', 'flyers', 'folheto', 'folhetos'],
    'Cartão de Visita': [
      'cartão de visita',
      'cartao de visita',
      'cartões de visita',
      'cartoes de visita',
    ],
    'Blocos': ['bloco', 'blocos', 'talão', 'talao', 'talões', 'receituário', 'receituario'],
    'Banner ou Lona': ['banner', 'banners', 'lona', 'lonas', 'faixa', 'faixas'],
    'Apostila': ['apostila', 'apostilas', 'encadernação', 'encadernacao', 'manual', 'manuais'],
  };

  /** Identifica produto em um trecho de texto (uma mensagem). */
  identificarProdutoNaMensagem(mensagem: string): CatalogItem | null {
    return this.identificarProdutoEmTexto(mensagem);
  }

  private identificarProdutoEmTexto(texto: string): CatalogItem | null {
    const textoLower = texto.toLowerCase();

    // Ordem: nomes mais específicos primeiro (evita falso positivo genérico)
    const ordem = [
      'Cartão de Visita',
      'Banner ou Lona',
      'Apostila',
      'Panfletos',
      'Blocos',
    ];

    for (const nome of ordem) {
      const item = this.catalogo.find((c) => c.produto === nome);
      if (!item) continue;
      const palavras = this.sinonimos[item.produto] || [item.produto.toLowerCase()];
      for (const palavra of palavras) {
        if (textoLower.includes(palavra)) {
          return item;
        }
      }
    }

    return null;
  }

  /** Só mensagens do cliente, da mais recente para a mais antiga. */
  private identificarProdutoNasMensagensCliente(historico: string): CatalogItem | null {
    const linhas = historico
      .split('\n')
      .filter((l) => l.startsWith('Cliente:'))
      .map((l) => l.replace(/^Cliente:\s*/i, '').trim());

    for (let i = linhas.length - 1; i >= 0; i--) {
      const item = this.identificarProdutoEmTexto(linhas[i]);
      if (item) return item;
    }
    return null;
  }

  private historicoApenasCliente(historico: string): string {
    return historico
      .split('\n')
      .filter((l) => l.startsWith('Cliente:'))
      .join('\n');
  }

  /**
   * Tenta extrair respostas do histórico da conversa para cada requisito.
   * Usa heurísticas simples de mapeamento (sem LLM, para funcionar sem API key).
   */
  /** Detecta pedido explícito de produto que não está no catálogo (só falas do cliente). */
  private pediuProdutoForaDoCatalogo(historico: string): boolean {
    if (this.identificarProdutoNasMensagensCliente(historico)) return false;

    const textoLower = this.historicoApenasCliente(historico).toLowerCase();
    const pediuAlgo =
      /\b(quero|preciso|fazer|imprimir|impressão|impressao|orcamento|orçamento|vocês fazem|voces fazem)\b/.test(
        textoLower
      );
    if (!pediuAlgo) return false;

    const foraCatalogo = [
      'camiseta', 'caneca', 'placa', 'adesivo', 'plotagem', 'sublimação', 'sublimacao',
      'brinde', 'crachá', 'cracha', 'uniforme',
    ];
    return foraCatalogo.some((termo) => textoLower.includes(termo));
  }

  private getUltimaMensagemCliente(historico: string): string {
    const linhas = historico.split('\n').filter((l) => l.startsWith('Cliente:'));
    const ultima = linhas[linhas.length - 1] || '';
    return ultima.replace(/^Cliente:\s*/i, '').trim();
  }

  private getUltimaMensagemAssistente(historico: string): string {
    const linhas = historico.split('\n').filter((l) => l.startsWith('Assistente:'));
    const ultima = linhas[linhas.length - 1] || '';
    return ultima.replace(/^Assistente:\s*/i, '').trim();
  }

  private extrairRespostas(
    historico: string,
    requisitos: string[]
  ): RequisitoStatus[] {
    const textoLower = historico.toLowerCase();
    const ultimaCliente = this.getUltimaMensagemCliente(historico).toLowerCase();
    const ultimaAssistente = this.getUltimaMensagemAssistente(historico).toLowerCase();

    return requisitos.map((pergunta) => {
      const perguntaLower = pergunta.toLowerCase();
      let resposta: string | null = null;

      // Heurística: "arte pronta"
      if (perguntaLower.includes('arte pronta') || perguntaLower.includes('arte')) {
        if (textoLower.includes('sim') && textoLower.includes('arte')) {
          resposta = 'Sim, tem arte pronta';
        } else if (
          (textoLower.includes('não') || textoLower.includes('nao')) &&
          textoLower.includes('arte')
        ) {
          resposta = 'Não tem arte pronta';
        } else if (
          /arte/.test(ultimaAssistente) &&
          /^(sim|tenho( sim)?|isso|claro|pode ser)\b/.test(ultimaCliente)
        ) {
          resposta = 'Sim, tem arte pronta';
        }
      }

      // Heurística: quantidade (busca números)
      if (perguntaLower.includes('quantidade') || perguntaLower.includes('quantas')) {
        const match = textoLower.match(
          /(\d{1,6})\s*(?:unidades|cartões|cartoes|panfletos|blocos|cópias|copias|und)?/
        );
        if (match) {
          resposta = `${match[1]} unidades`;
        } else if (/^\d{1,6}$/.test(ultimaCliente.trim())) {
          resposta = `${ultimaCliente.trim()} unidades`;
        } else if (
          /quantidade/.test(ultimaAssistente) &&
          /^\d{1,6}$/.test(ultimaCliente.trim())
        ) {
          resposta = `${ultimaCliente.trim()} unidades`;
        }
      }

      // Heurística: tamanho
      if (perguntaLower.includes('tamanho') || perguntaLower.includes('qual o tamanho')) {
        const match = textoLower.match(/(\d+\s*x\s*\d+\s*(?:cm|mm)?|a4|a5|a3)/i);
        if (match) {
          resposta = match[1].toUpperCase();
        } else if (
          /\b(maior|menor|personalizado|customizado|outro tamanho)\b/.test(ultimaCliente) &&
          /tamanho/.test(ultimaAssistente)
        ) {
          resposta = 'Tamanho personalizado (a definir em cm)';
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
   * Extrai entidades do pedido.
   * Regra: produto vem do contexto da sessão OU da última menção explícita do CLIENTE (nunca do bot).
   */
  extract(conversationHistory: string, options?: ExtractOptions): PedidoEntities {
    let produto: CatalogItem | null = null;

    if (options?.produtoAtual) {
      produto =
        this.catalogo.find(
          (c) => c.produto.toLowerCase() === options.produtoAtual!.toLowerCase()
        ) || null;
    }

    if (!produto) {
      produto = this.identificarProdutoNasMensagensCliente(conversationHistory);
    }

    if (!produto) {
      return {
        produtoIdentificado: null,
        produtoDesconhecido: this.pediuProdutoForaDoCatalogo(conversationHistory),
        requisitos: [],
        completo: false,
        perguntasFaltantes: [],
      };
    }

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

  /**
   * Retorna as regras técnicas estritas para validação avançada, baseada no catalogo_produtos.json
   */
  getRegrasTecnicas(productNameKey: string): any | null {
    return this.regrasTecnicas[productNameKey] || null;
  }
}

export const entityExtractionService = new EntityExtractionService();
