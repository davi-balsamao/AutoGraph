/**
 * Probe das chaves do Gemini.
 *
 * Para cada chave do pool, faz um chat e um embedding simples e mede a latência.
 * Detecta rate-limits/quota explícitos pelo erro retornado.
 *
 * Uso: npx ts-node src/scripts/probe-keys.ts
 */
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChatGroq } from '@langchain/groq';
import dotenv from 'dotenv';

dotenv.config();

const CHAT_TIMEOUT_MS = 20_000;
const EMBED_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let handle: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    handle = setTimeout(() => reject(new Error(`timeout ${label} (${ms}ms)`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(handle!));
}

function maskKey(key: string): string {
  if (key.length < 12) return '***';
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

async function probeChat(key: string, model: string, provider: 'gemini' | 'groq' = 'gemini') {
  const llm =
    provider === 'groq'
      ? new ChatGroq({ model, apiKey: key, temperature: 0 })
      : new ChatGoogleGenerativeAI({ model, apiKey: key, temperature: 0 });
  const t0 = Date.now();
  try {
    const res = await withTimeout(
      llm.invoke([{ role: 'user', content: 'Responda apenas "ok".' }]),
      CHAT_TIMEOUT_MS,
      'chat'
    );
    const ms = Date.now() - t0;
    const text = typeof res.content === 'string' ? res.content : JSON.stringify(res.content);
    return { ok: true as const, ms, sample: text.slice(0, 60) };
  } catch (err: any) {
    const ms = Date.now() - t0;
    return { ok: false as const, ms, error: err?.message || String(err) };
  }
}

async function probeEmbed(key: string) {
  const emb = new GoogleGenerativeAIEmbeddings({ modelName: 'gemini-embedding-001', apiKey: key });
  const t0 = Date.now();
  try {
    const vec = await withTimeout(emb.embedQuery('teste de probe'), EMBED_TIMEOUT_MS, 'embed');
    return { ok: true as const, ms: Date.now() - t0, dims: vec.length };
  } catch (err: any) {
    return { ok: false as const, ms: Date.now() - t0, error: err?.message || String(err) };
  }
}

async function main() {
  const provider = (process.env.LLM_PROVIDER || 'groq').toLowerCase() as 'gemini' | 'groq';
  const chatKeys = (
    provider === 'groq' ? process.env.GROQ_API_KEY : process.env.GOOGLE_API_KEY
  ) || '';
  const chatKeyList = chatKeys.split(',').map(k => k.trim()).filter(Boolean);
  const embedKeys = (process.env.GOOGLE_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  const chatModel =
    process.env.LLM_EXTRACTOR_MODEL ||
    process.env.LLM_MODEL ||
    (provider === 'groq' ? 'llama-3.1-8b-instant' : 'gemini-2.5-flash');

  console.log(`📋 Provider de chat: ${provider} (${chatKeyList.length} chave(s), modelo ${chatModel})`);
  console.log(`📋 Provider de embeddings: gemini (${embedKeys.length} chave(s))\n`);

  console.log('═══ CHAT ═══');
  for (let i = 0; i < chatKeyList.length; i++) {
    const key = chatKeyList[i];
    const chat = await probeChat(key, chatModel, provider);
    if (chat.ok) {
      console.log(`🔑 ${i + 1}/${chatKeyList.length} (${maskKey(key)}) — ✅ ${chat.ms}ms — "${chat.sample}"`);
    } else {
      const isRateLimit = /quota|rate.limit|429|RESOURCE_EXHAUSTED|exceeded|TooManyRequests/i.test(chat.error);
      console.log(`🔑 ${i + 1}/${chatKeyList.length} (${maskKey(key)}) — ❌ ${chat.ms}ms — ${isRateLimit ? '🚨 RATE-LIMIT' : 'erro'}: ${chat.error.slice(0, 200)}`);
    }
  }

  console.log('\n═══ EMBEDDINGS ═══');
  for (let i = 0; i < embedKeys.length; i++) {
    const key = embedKeys[i];
    const embed = await probeEmbed(key);
    if (embed.ok) {
      console.log(`🔑 ${i + 1}/${embedKeys.length} (${maskKey(key)}) — ✅ ${embed.ms}ms — ${embed.dims} dims`);
    } else {
      const isRateLimit = /quota|rate.limit|429|RESOURCE_EXHAUSTED|exceeded|TooManyRequests/i.test(embed.error);
      console.log(`🔑 ${i + 1}/${embedKeys.length} (${maskKey(key)}) — ❌ ${embed.ms}ms — ${isRateLimit ? '🚨 RATE-LIMIT' : 'erro'}: ${embed.error.slice(0, 200)}`);
    }
  }
}

main().catch(err => {
  console.error('Probe falhou:', err);
  process.exit(1);
});
