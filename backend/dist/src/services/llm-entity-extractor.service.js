"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmEntityExtractor = exports.LlmEntityExtractor = void 0;
exports.dropHallucinatedSpecs = dropHallucinatedSpecs;
exports.parseLlmResponse = parseLlmResponse;
const llm_factory_1 = require("./llm-factory");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const DEFAULT_TIMEOUT_MS = 30_000;
function buildPrompt(input) {
    const produtos = input.catalogoProdutos.join(', ');
    const produtoAtual = input.produtoAtual || '(nenhum)';
    const requisitos = input.requisitosCatalogo?.length
        ? input.requisitosCatalogo.map((r) => `  • "${r}"`).join('\n')
        : '  (nenhum — produto não identificado ainda)';
    return `Você é um extrator DETERMINÍSTICO de entidades em conversas de gráfica.
Sua ÚNICA fonte de verdade é o HISTÓRICO abaixo. Você NÃO pode inventar valores,
NÃO pode inferir do "contexto típico", NÃO pode completar com defaults.

REGRA DE OURO: se a informação não está LITERALMENTE escrita no histórico do
cliente (linhas iniciadas por "Cliente:"), retorne null. Não importa o quão
óbvio você ache que seja.

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
4. specs: para CADA pergunta do catálogo, extraia a resposta SOMENTE se ela aparecer
   no que o cliente escreveu. Caso contrário, null. Use a string da pergunta como
   chave EXATAMENTE como aparece acima. Regras anti-alucinação:
   • Números devem estar LITERALMENTE no histórico ("1000 unidades" → só extraia
     se "1000" aparecer textual; jamais arredonde, jamais infira).
   • Se o cliente disse só "quero cartão de visita" sem qualquer spec → TODAS as
     specs devem ser null. Não preencha valores "típicos" ou "esperados".
   • Se o cliente respondeu uma pergunta com paráfrase (ex.: "ambos os lados"
     para uma pergunta sobre frente/verso), você pode normalizar para o termo
     do catálogo — mas a paráfrase precisa estar no histórico.
   • Booleanos (verniz, laminação): null se o cliente não mencionou
     explicitamente. NUNCA chute "true" ou "false".
5. resolveuReferencia: se o cliente usou referência ambígua ("a primeira", "essa", "a que você sugeriu") e foi possível identificar no histórico recente, preencha { texto, referenciaEncontrada }. Caso contrário null.

# Exemplos do que NÃO fazer
Histórico: "Cliente: Quero cartão de visita para minha empresa."
ERRADO: {"specs": {"Qual quantidade deseja?": "1000 unidades", ...}}
CERTO:  {"specs": {"Qual quantidade deseja?": null, ...}}  // não foi mencionado

Histórico: "Cliente: 500 unidades, formato 9x5cm, só frente colorida."
ERRADO: {"specs": {"Terá verniz total?": "true", ...}}    // alucinado
CERTO:  {"specs": {"Terá verniz total?": null, ...}}      // não foi mencionado

Antes de devolver, FAÇA o auto-check: para cada spec NÃO-null, confirme mentalmente
que o valor que você está retornando aparece no histórico do cliente. Se não
aparece, troque por null.

Responda APENAS com JSON válido. Sem markdown, sem comentários, sem prefixos.`;
}
class LlmEntityExtractor {
    /** Extrai entidades com timeout. Lança erro se LLM falhar ou estourar timeout. */
    async extract(input, timeoutMs = DEFAULT_TIMEOUT_MS) {
        const prompt = buildPrompt(input);
        // Constrói o LLM por request para que a rotação de chaves do factory
        // funcione efetivamente (próxima chave do pool a cada chamada).
        const llm = (0, llm_factory_1.createChatLlm)('extractor');
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`LlmEntityExtractor timeout após ${timeoutMs}ms`)), timeoutMs);
        });
        const llmCall = llm.invoke([{ role: 'user', content: prompt }]);
        const response = await Promise.race([llmCall, timeoutPromise]);
        const raw = response.content;
        const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
        const parsed = parseLlmResponse(text);
        parsed.specs = dropHallucinatedSpecs(parsed.specs, input.historicoCompleto);
        return parsed;
    }
}
exports.LlmEntityExtractor = LlmEntityExtractor;
/**
 * Filtro determinístico pós-LLM: descarta valores que claramente foram
 * alucinados (ex.: número que não aparece no que o cliente escreveu).
 *
 * Estratégia conservadora — só zera quando a evidência de alucinação é forte,
 * pra não derrubar paráfrases legítimas:
 *  • Se o valor extraído contém dígitos, TODOS os números devem aparecer no
 *    histórico do cliente. Caso contrário → null.
 *  • Valores puramente textuais (sem dígitos) passam direto. O prompt já cuida
 *    do resto.
 */
function dropHallucinatedSpecs(specs, historicoCompleto) {
    const userText = historicoCompleto
        .split('\n')
        .filter((l) => /^Cliente:/i.test(l))
        .map((l) => l.replace(/^Cliente:\s*/i, ''))
        .join(' ');
    const cleaned = {};
    for (const [k, v] of Object.entries(specs)) {
        if (!v) {
            cleaned[k] = null;
            continue;
        }
        const numbers = v.match(/\d+/g);
        if (numbers && numbers.length > 0) {
            const allFound = numbers.every((n) => userText.includes(n));
            cleaned[k] = allFound ? v : null;
        }
        else {
            cleaned[k] = v;
        }
    }
    return cleaned;
}
/**
 * Parser defensivo: aceita JSON puro ou JSON envolvido por markdown (```json ... ```).
 * Lança erro se a saída não puder ser interpretada como objeto válido.
 */
function parseLlmResponse(text) {
    const cleaned = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/, '')
        .trim();
    let obj;
    try {
        obj = JSON.parse(cleaned);
    }
    catch (err) {
        throw new Error(`LlmEntityExtractor: saída não-JSON: ${cleaned.slice(0, 200)}`);
    }
    if (!obj || typeof obj !== 'object') {
        throw new Error('LlmEntityExtractor: saída não é objeto JSON');
    }
    const o = obj;
    const specsRaw = o.specs;
    const specs = {};
    if (specsRaw && typeof specsRaw === 'object' && !Array.isArray(specsRaw)) {
        for (const [k, v] of Object.entries(specsRaw)) {
            specs[k] = typeof v === 'string' && v.trim() ? v.trim() : null;
        }
    }
    const intent = o.intent || 'OUTRO';
    const validIntents = [
        'NOVO_PEDIDO', 'TROCAR_PRODUTO', 'NOVO_ATENDIMENTO', 'DUVIDA',
        'NEGOCIACAO', 'APROVACAO', 'RECUSA', 'OUTRO',
    ];
    const normalizedIntent = validIntents.includes(intent)
        ? intent
        : 'OUTRO';
    const ref = o.resolveuReferencia;
    const resolveuReferencia = ref && typeof ref.texto === 'string' && typeof ref.referenciaEncontrada === 'string'
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
exports.llmEntityExtractor = new LlmEntityExtractor();
