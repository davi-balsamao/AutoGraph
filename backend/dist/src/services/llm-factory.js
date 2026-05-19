"use strict";
// Touch para forçar reload do ts-node-dev quando .env muda.
/**
 * Factory de LLMs de chat com rotação de chaves (round-robin).
 *
 * Trocar de provider é só mudar `LLM_PROVIDER` no .env. Para distribuir
 * carga entre múltiplas chaves do mesmo provider (e contornar rate limits
 * gratuitos), liste as chaves separadas por vírgula:
 *
 *   GROQ_API_KEY=key1,key2,key3
 *   GOOGLE_API_KEY=key1,key2
 *
 * Cada chamada a createChatLlm() seleciona a próxima chave do pool. Como
 * a instância LangChain é criada por request, a rotação acontece em cada
 * invocação real do LLM (RAG, extractor).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLlmProvider = getLlmProvider;
exports.getKeyPoolSize = getKeyPoolSize;
exports.createChatLlm = createChatLlm;
exports.nextEmbeddingApiKey = nextEmbeddingApiKey;
const groq_1 = require("@langchain/groq");
const google_genai_1 = require("@langchain/google-genai");
const ROLE_CONFIG = {
    rag: {
        temperature: 0.3,
        defaults: {
            groq: 'llama-3.1-8b-instant',
            gemini: 'gemini-2.5-flash',
        },
        modelEnvVar: 'LLM_MODEL',
    },
    extractor: {
        temperature: 0,
        defaults: {
            groq: 'llama-3.1-8b-instant',
            gemini: 'gemini-2.5-flash',
        },
        modelEnvVar: 'LLM_EXTRACTOR_MODEL',
    },
};
const FALLBACKS = {
    groq: 'gsk_mock_key_for_local_testing',
    gemini: 'AIzaSyMockKeyForLocalTestingOnlyDoNotUse',
};
const ENV_VARS = {
    groq: 'GROQ_API_KEY',
    gemini: 'GOOGLE_API_KEY',
};
const keyPools = {
    groq: null,
    gemini: null,
};
function parseKeys(raw, fallback) {
    const list = (raw || '')
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
    return list.length > 0 ? list : [fallback];
}
function getPool(provider) {
    let pool = keyPools[provider];
    if (!pool) {
        const keys = parseKeys(process.env[ENV_VARS[provider]], FALLBACKS[provider]);
        pool = { keys, index: 0 };
        keyPools[provider] = pool;
        if (keys.length > 1) {
            console.log(`🔑 [LLM Factory] ${provider}: ${keys.length} chaves carregadas — rotação round-robin ativa.`);
        }
    }
    return pool;
}
function nextKey(provider) {
    const pool = getPool(provider);
    const key = pool.keys[pool.index];
    pool.index = (pool.index + 1) % pool.keys.length;
    return key;
}
function getLlmProvider() {
    const raw = (process.env.LLM_PROVIDER || 'groq').toLowerCase();
    if (raw !== 'groq' && raw !== 'gemini') {
        throw new Error(`LLM_PROVIDER inválido: "${raw}". Use "groq" ou "gemini".`);
    }
    return raw;
}
/** Tamanho do pool de chaves do provider (útil para logging em testes). */
function getKeyPoolSize(provider) {
    return getPool(provider).keys.length;
}
/**
 * Cria uma instância de chat LLM com a próxima chave do pool. Chame por
 * request — instâncias são objetos leves, sem conexões persistentes.
 */
function createChatLlm(role) {
    const provider = getLlmProvider();
    const cfg = ROLE_CONFIG[role];
    const model = process.env[cfg.modelEnvVar] || cfg.defaults[provider];
    const apiKey = nextKey(provider);
    if (provider === 'gemini') {
        return new google_genai_1.ChatGoogleGenerativeAI({
            model,
            apiKey,
            temperature: cfg.temperature,
            maxRetries: 0,
        });
    }
    return new groq_1.ChatGroq({
        model,
        apiKey,
        temperature: cfg.temperature,
        maxRetries: 0,
    });
}
/** Próxima chave do pool de embeddings (mesmo pool do Gemini). */
function nextEmbeddingApiKey() {
    return nextKey('gemini');
}
