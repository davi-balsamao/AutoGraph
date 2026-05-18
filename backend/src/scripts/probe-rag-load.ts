/**
 * Simula uma chamada RAG do tamanho real (prompt ~3KB + histórico) pra medir
 * latência sob carga similar à produção. Útil pra distinguir "chave exausta"
 * (rate-limit explícito) de "prompt grande causa lentidão pontual".
 */
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import dotenv from 'dotenv';

dotenv.config();

const TIMEOUT_MS = 30_000;
const ROUNDS = 5;

const BIG_PROMPT = `Você é uma atendente virtual da Gráfica AutoGraph. Atenda de forma simpática, direta e curta.

## COMO VOCÊ CONVERSA
- Seja direta. NUNCA pergunte "o que você gostaria de imprimir?".
- UMA pergunta por mensagem quando estiver coletando especificações.
- NUNCA use linhas em branco entre frases. Use apenas uma quebra de linha simples ou nenhuma.
- Sem emojis em excesso (máximo 1). Sem negritos ou listas.

## ORÇAMENTO E PREÇOS
1. Calcule valores SOMENTE com base na Tabela de Preços do contexto. Nunca invente valores.
2. No estado CALCULAR_ORCAMENTO: responda EXCLUSIVAMENTE com a linha de cálculo no formato exato abaixo.
3. No estado APRESENTAR_ORCAMENTO: apresente o valor aprovado SEM pedir aprovação nesta mensagem.

## ESTADO ATUAL: VALIDAR_ARQUIVO
Perguntar de forma simples: "Você já tem o arquivo de arte pronto?"
Informar formatos aceitos: PDF, JPG, PNG, TIFF
NÃO pedir DPI/resolução/sangria ao cliente.

## BASE DE CONHECIMENTO
--- Documento 1 ---
Para impressão em gráfica, aceitamos arquivos nos seguintes formatos: PDF (preferencial), JPG (qualidade alta), PNG, TIFF. Arquivos em PSD, AI ou CDR não são aceitos diretamente — peça pro cliente exportar para um dos formatos aceitos.

--- Documento 2 ---
Quando o cliente envia arquivo em formato incompatível, oriente: "Formatos de softwares de edição (como .PSD, .AI, .CDR) não são aceitos diretamente. Por favor, salve ou exporte seu arquivo em PDF, JPG, PNG ou TIFF antes de enviar!"

--- Documento 3 ---
Resolução mínima recomendada: 300 dpi. Para banners grandes, 150 dpi é suficiente.

--- Documento 4 ---
Após validar o arquivo, o próximo passo é calcular o orçamento. Não pergunte sobre DPI, sangria ou dimensões — isso é validado pela recepcionista.

Cliente: Tenho o arquivo de arte em .PSD com todas as camadas abertas.`;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let handle: NodeJS.Timeout;
  const timeout = new Promise<never>((_, rej) => {
    handle = setTimeout(() => rej(new Error(`timeout ${label} (${ms}ms)`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(handle!));
}

async function probe(round: number, key: string, model: string) {
  const llm = new ChatGoogleGenerativeAI({ model, apiKey: key, temperature: 0.3 });
  const t0 = Date.now();
  try {
    const res = await withTimeout(
      llm.invoke([{ role: 'user', content: BIG_PROMPT }]),
      TIMEOUT_MS,
      `chat-rag-${round}`
    );
    const ms = Date.now() - t0;
    const text = typeof res.content === 'string' ? res.content : JSON.stringify(res.content);
    return { ok: true as const, ms, sample: text.slice(0, 80) };
  } catch (err: any) {
    return { ok: false as const, ms: Date.now() - t0, error: err?.message || String(err) };
  }
}

async function main() {
  const keys = (process.env.GOOGLE_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  const model = process.env.LLM_MODEL || 'gemini-2.5-flash';
  console.log(`📋 ${keys.length} chave(s), prompt de ${BIG_PROMPT.length} chars, ${ROUNDS} rodadas (rotação round-robin).\n`);

  let total = 0;
  let failed = 0;
  for (let i = 0; i < ROUNDS; i++) {
    const key = keys[i % keys.length];
    const result = await probe(i + 1, key, model);
    if (result.ok) {
      total += result.ms;
      console.log(`Rodada ${i + 1}: ✅ ${result.ms}ms — "${result.sample}"`);
    } else {
      failed++;
      console.log(`Rodada ${i + 1}: ❌ ${result.ms}ms — ${result.error.slice(0, 150)}`);
    }
  }

  const okCount = ROUNDS - failed;
  console.log(`\n📊 ${okCount}/${ROUNDS} rodadas OK${okCount > 0 ? `, média ${Math.round(total / okCount)}ms` : ''}.`);
  if (failed > 0) {
    console.log(`⚠️  ${failed} falhas — chaves possivelmente sob estresse.`);
  } else {
    console.log('✅ Chaves saudáveis para carga típica de RAG.');
  }
}

main().catch(err => { console.error('Probe falhou:', err); process.exit(1); });
