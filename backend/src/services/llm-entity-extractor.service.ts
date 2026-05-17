/**
 * LlmEntityExtractor — extração de entidades via Gemini com saída JSON estruturada.
 *
 * Substitui as heurísticas regex de `entity-extraction.service.ts` para:
 *  - Identificar produto mesmo com sinônimos / variações de grafia
 *  - Capturar specs sem ambiguidade ("1000 unidades" ≠ "10")
 *  - Resolver referências contextuais ("a primeira", "essa", "a que você sugeriu")
 *  - Classificar intent de turno (NOVO_PEDIDO, DUVIDA, NEGOCIACAO, etc.)
 *
 * Características:
 *  - `responseMimeType: 'application/json'` força saída parseável
 *  - Temperature 0 — determinístico para extração
 *  - Timeout 5s (controlado por quem chama); o serviço só lança erro
 *  - Sem fallback aqui: o fallback (regex) é responsabilidade do EntityExtractionService
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import dotenv from 'dotenv';

dotenv.config();

export type LlmIntent =
  | 'NOVO_PEDIDO'
  | 'TROCAR_PRODUTO'
  | 'NOVO_ATENDIMENTO'
  | 'DUVIDA'
  | 'NEGOCIACAO'
  | 'APROVACAO'
  | 'RECUSA'
  | 'OUTRO';

export interface LlmExtractInput {
  /** Histórico completo da conversa (linhas "Cliente: ..." e "Assistente: ..."). */
  historicoCompleto: string;
  /** Produto travado na sessão atual, se houver. */
  produtoAtual?: string | null;
  /** Lista de requisitos do produto atual (perguntas do catálogo). */
  requisitosCatalogo?: string[];
  /** Nomes dos produtos disponíveis no catálogo. */
  catalogoProdutos: string[];
}

export interface LlmExtractResult {
  produtoIdentificado: string | null;
  produtoDesconhecido: boolean;
  intent: LlmIntent;
  /** Mapa { pergunta_do_catalogo: resposta_extraida | null }. */
  specs: Record<string, string | null>;
  /** Resolução de referência anafórica, se houve uma. */
  resolveuReferencia: { texto: string; referenciaEncontrada: string } | null;
}

const DEFAULT_TIMEOUT_MS = 30_000;

function buildPrompt(input: LlmExtractInput): string {
  const produtos = input.catalogoProdutos.join(', ');
  const produtoAtual = input.produtoAtual || '(nenhum)';
  const requisitos = input.requisitosCatalogo?.length
    ? input.requisitosCatalogo.map((r) => `  • "${r}"`).join('\n')
    : '  (nenhum — produto não identificado ainda)';

  return `Você é um extrator de entidades de uma conversa de atendimento de gráfica.
Analise o HISTÓRICO abaixo e retorne JSON com a extração estruturada.

# Catálogo disponível
${produtos}

# Produto travado na sessão
${produtoAtual}

# Perguntas do catálogo para o produto atual
${requisitos}

# Histórico da conversa
${input.historicoCompleto}

# Regras
1. produtoIdentificado: nome EXATO do catálogo (preserve capitalização). Se não houver, null.
2. produtoDesconhecido: true se o cliente pediu impressão de algo que NÃO está no catálogo (camiseta, caneca, adesivo, plotagem, etc.).
3. intent: classifique o turno atual (última fala do cliente):
   - "NOVO_PEDIDO": cliente está iniciando um pedido novo dentro do fluxo normal
   - "TROCAR_PRODUTO": cliente mudou de ideia para outro produto do catálogo
   - "NOVO_ATENDIMENTO": cliente quer recomeçar do zero (cancelar tudo, esquecer)
   - "DUVIDA": pergunta sem decisão (dúvida técnica/comercial)
   - "NEGOCIACAO": questiona preço/prazo/condições
   - "APROVACAO": aceita orçamento/pedido
   - "RECUSA": rejeita orçamento/pedido
   - "OUTRO": qualquer outra coisa
4. specs: para CADA pergunta do catálogo listada acima, extraia a resposta do cliente literal do histórico — preserve números EXATOS (ex: "1000 unidades" NUNCA "10"). Se a resposta não estiver no histórico, null. Use a string da pergunta como chave EXATAMENTE como aparece acima.
5. resolveuReferencia: se o cliente usou referência ambígua ("a primeira", "essa", "a que você sugeriu") e foi possível identificar no histórico recente, preencha { texto, referenciaEncontrada }. Caso contrário null.

Responda APENAS com JSON válido. Sem markdown, sem comentários, sem prefixos.`;
}

export class LlmEntityExtractor {
  private llm: ChatGoogleGenerativeAI;

  constructor() {
    console.log('DEBUG: LlmEntityExtractor constructor called!');
    console.log('DEBUG: process.env.LLM_MODEL is:', process.env.LLM_MODEL);
    console.log('DEBUG: process.env.GOOGLE_API_KEY is:', process.env.GOOGLE_API_KEY ? 'Present' : 'Missing');
    const apiKey = process.env.GOOGLE_API_KEY || 'AIzaSyMockKeyForLocalTestingOnlyDoNotUse';
    // Saída JSON é garantida via instrução no prompt + parser tolerante a
    // markdown code-fences (parseLlmResponse). Não usamos responseMimeType
    // da SDK porque a flag não é suportada de forma estável pelo LangChain.
    this.llm = new ChatGoogleGenerativeAI({
      temperature: 0,
      model: process.env.LLM_MODEL || 'gemini-2.0-flash',
      apiKey,
    });
  }

  async extract(input: LlmExtractInput, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<LlmExtractResult> {
    const prompt = buildPrompt(input);
    console.log('DEBUG: Invoking LLM with prompt length:', prompt.length);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`LlmEntityExtractor timeout após ${timeoutMs}ms`)), timeoutMs);
    });

    const startCall = Date.now();
    try {
      const llmCall = this.llm.invoke([{ role: 'user', content: prompt }]);
      const response = await Promise.race([llmCall, timeoutPromise]);
      console.log(`DEBUG: LLM responded in ${Date.now() - startCall}ms!`);
      const raw = (response as { content: unknown }).content;
      const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
      console.log('DEBUG: Raw response content:', text);

      return parseLlmResponse(text);
    } catch (err) {
      console.error(`DEBUG: Extraction call failed after ${Date.now() - startCall}ms with error:`, err);
      throw err;
    }
  }
}

/**
 * Parser defensivo: aceita JSON puro ou JSON envolvido por markdown (```json ... ```).
 * Lança erro se a saída não puder ser interpretada como objeto válido.
 */
export function parseLlmResponse(text: string): LlmExtractResult {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  let obj: unknown;
  try {
    obj = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`LlmEntityExtractor: saída não-JSON: ${cleaned.slice(0, 200)}`);
  }

  if (!obj || typeof obj !== 'object') {
    throw new Error('LlmEntityExtractor: saída não é objeto JSON');
  }

  const o = obj as Record<string, unknown>;
  const specsRaw = o.specs;
  const specs: Record<string, string | null> = {};
  if (specsRaw && typeof specsRaw === 'object' && !Array.isArray(specsRaw)) {
    for (const [k, v] of Object.entries(specsRaw)) {
      specs[k] = typeof v === 'string' && v.trim() ? v.trim() : null;
    }
  }

  const intent = (o.intent as string) || 'OUTRO';
  const validIntents: LlmIntent[] = [
    'NOVO_PEDIDO', 'TROCAR_PRODUTO', 'NOVO_ATENDIMENTO', 'DUVIDA',
    'NEGOCIACAO', 'APROVACAO', 'RECUSA', 'OUTRO',
  ];
  const normalizedIntent = validIntents.includes(intent as LlmIntent)
    ? (intent as LlmIntent)
    : 'OUTRO';

  const ref = o.resolveuReferencia as Record<string, unknown> | null | undefined;
  const resolveuReferencia =
    ref && typeof ref.texto === 'string' && typeof ref.referenciaEncontrada === 'string'
      ? { texto: ref.texto, referenciaEncontrada: ref.referenciaEncontrada }
      : null;

  return {
    produtoIdentificado: typeof o.produtoIdentificado === 'string' ? o.produtoIdentificado : null,
    produtoDesconhecido: o.produtoDesconhecido === true,
    intent: normalizedIntent,
    specs,
    resolveuReferencia,
  };
}

export const llmEntityExtractor = new LlmEntityExtractor();
