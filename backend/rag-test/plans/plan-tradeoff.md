# Plano — Unificar cache do EntityExtraction e aumentar timeout do LLM

## Contexto

Depois da **Fase 3** ([commit 18d6046](backend/src/services/entity-extraction.service.ts)) o `EntityExtractionService` virou LLM-first com timeout de 5s. Em testes E2E o aviso `⚠️ [EntityExtraction] LLM falhou (LlmEntityExtractor timeout após 5000ms) — fallback regex.` aparece 2–4× por turno e o tempo total dos testes praticamente dobrou.

Causa raiz: o extractor é chamado de **três call-sites diferentes** no mesmo turno, cada um com um `historico` diferente — gerando 3 chaves distintas no cache (sha256 do histórico) e portanto **3 chamadas independentes ao Gemini**, cada uma sujeita ao timeout de 5s. Como `gemini-2.0-flash` com prompt grande (catálogo + histórico + requisitos) frequentemente leva 4–7s, várias estouram o limite.

Call-sites e o que passam como histórico:

| Call-site | Histórico passado | Caching |
|---|---|---|
| [intent.service.ts:54](backend/src/fsm/intent.service.ts:54) | `conversationHistory` completo (montado em state-router) | chave A |
| [base.handler.ts:69](backend/src/fsm/handlers/base.handler.ts:69) (via `prepareContext`) | `deps.conversationHistory` (mesmo de cima) | chave A — **hit** |
| [identificar-necessidade.handler.ts:40](backend/src/fsm/handlers/identificar-necessidade.handler.ts:40) | `deps.conversationHistory` | chave A — **hit** |
| [state-router.ts:91](backend/src/fsm/state-router.ts:91) | `Cliente: ${message}` (só última msg) | chave B — **miss** |
| [webhook.service.ts:128](backend/src/services/webhook.service.ts:128) | só linhas `Cliente:` do histórico + última msg | chave C — **miss** |

Resultado esperado: reduzir de 2–3 chamadas LLM por turno para **1**, e tolerar latências realistas do Gemini sem cair em fallback regex.

## Mudanças

### 1. Normalizar a chave de cache no `EntityExtractionService`

[backend/src/services/entity-extraction.service.ts:72](backend/src/services/entity-extraction.service.ts:72) — `cacheKey()` hoje é `sha256(historico|||produtoAtual)`. Trocar para uma forma canônica: hash apenas das **mensagens do cliente** (uma por linha, prefixo removido) + produtoAtual. Assim os três formatos diferentes passados pelos call-sites colapsam na mesma chave.

```ts
function canonicalizarHistorico(historico: string): string {
  return historico
    .split('\n')
    .filter((l) => l.startsWith('Cliente:'))
    .map((l) => l.replace(/^Cliente:\s*/i, '').trim())
    .join('\n');
}

function cacheKey(historico: string, produtoAtual?: string | null): string {
  return crypto
    .createHash('sha256')
    .update(`${canonicalizarHistorico(historico)}|||${produtoAtual ?? ''}`)
    .digest('hex');
}
```

Importante: a canonização é **só para a chave**, não para o que é enviado ao LLM. O prompt continua recebendo o histórico completo (com falas do assistente) — o LLM precisa disso para resolver referências e classificar intent.

### 2. Subir timeout do LLM de 5s → 10s

[backend/src/services/llm-entity-extractor.service.ts:53](backend/src/services/llm-entity-extractor.service.ts:53) e [backend/src/services/entity-extraction.service.ts:91](backend/src/services/entity-extraction.service.ts:91):

```ts
// llm-entity-extractor.service.ts
const DEFAULT_TIMEOUT_MS = 10_000;

// entity-extraction.service.ts
const LLM_TIMEOUT_MS = 10_000;
```

10s é o sweet spot: cobre p95 do `gemini-2.0-flash` com prompt de ~2KB sem deixar o usuário esperando indefinidamente se a API cair de verdade. O fallback regex continua ativo para erros reais.

### 3. Corrigir o comentário sobre JSON mode

O comentário em [llm-entity-extractor.service.ts:100](backend/src/services/llm-entity-extractor.service.ts:100) afirma `responseMimeType: 'application/json'` mas a flag nunca foi passada para `ChatGoogleGenerativeAI` — o parser tolerante a markdown fence é o que sustenta o pipeline na prática. Atualizar o comentário para refletir a realidade: a saída JSON é garantida **pelo prompt + parser tolerante**, sem flag de SDK.

## Arquivos a modificar

- [backend/src/services/entity-extraction.service.ts](backend/src/services/entity-extraction.service.ts) — função `cacheKey` e constante `LLM_TIMEOUT_MS`
- [backend/src/services/llm-entity-extractor.service.ts](backend/src/services/llm-entity-extractor.service.ts) — constante `DEFAULT_TIMEOUT_MS` (e opcionalmente JSON mode)

## Verificação

1. **Subir Postgres local** (`Test-NetConnection localhost -Port 5432` deve retornar `True`) e rodar `npm run dev` no backend com `USE_MOCK_WHATSAPP=true`.

2. **Rodar fluxo 2 isolado** (caso problemático no log atual):
   ```
   npx jest src/tests/fluxos/fluxo2.test.ts --runInBand
   ```
   Esperado:
   - O aviso `LLM falhou (timeout)` cai para **0–1 ocorrências** no log (vs. 4 antes).
   - O teste `deve esclarecer dúvida e retomar fluxo normal` passa (estado `ESCLARECER_DUVIDA` é atingido), porque a extração LLM completa dentro do tempo e classifica o intent corretamente como `DUVIDA`.
   - Tempo total da suíte cai (esperado: ~25-30s vs. ~46s).

3. **Rodar fluxo 5** para confirmar que o cache compartilhado não regrediu nada:
   ```
   npx jest src/tests/fluxos/fluxo5.test.ts --runInBand
   ```

4. **Sanity nos unit tests do extractor** (não devem regredir):
   ```
   npx jest src/tests/services/entity-extraction.test.ts
   ```
   O teste em [entity-extraction.test.ts:147-149](backend/src/tests/services/entity-extraction.test.ts:147) já verifica que 3 chamadas no mesmo histórico só disparam 1 LLM — continua passando porque o histórico já é idêntico ali.