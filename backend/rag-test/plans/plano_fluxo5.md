## Plan: Corrigir fluxo 5 de pergunta de preço antes de specs

TL;DR: o fluxo quebra porque a detecção de dúvida não reconhece perguntas de preço como um desvio para `ESCLARECER_DUVIDA` quando o produto já está identificado. A correção passa por ajustar a regex de dúvida/preço na FSM e adicionar um teste de regressão no handler de identificação de necessidade.

**Passos**
1. Atualizar `backend/src/fsm/transition.service.ts`.
   - Ampliar o regex `DUVIDA` para incluir termos de preço e orçamentos como `preço`, `preco`, `quanto custa`, `valor`, `orçamento`, `orcamento`, `preciso saber`.
   - Garantir que essa regra funcione para `IDENTIFICAR_NECESSIDADE` e `COLETAR_ESPECIFICACOES` sem alterar o comportamento das dúvidas técnicas já existentes.

2. Adicionar teste de regressão em `backend/src/tests/handlers/identificar-necessidade.handler.test.ts`.
   - Criar caso que simule a mensagem `Preciso saber o preço de 1000 panfletos, me diz logo.`
   - Mockar `entityExtractionService.identificarProdutoNaMensagem` para retornar um produto identificado.
   - Verificar que o handler retorna `ConversationState.ESCLARECER_DUVIDA` e invoca `ragService.queryWithState`.

3. Executar validação local.
   - Rodar `npx jest src/tests/fluxos/fluxo5.test.ts` para confirmar que o fluxo 5 passa.
   - Rodar `npx jest src/tests/handlers/identificar-necessidade.handler.test.ts` para garantir a regressão.

**Arquivos relevantes**
- `backend/src/fsm/transition.service.ts` — onde a FSM decide quando entrar em `ESCLARECER_DUVIDA`.
- `backend/src/tests/handlers/identificar-necessidade.handler.test.ts` — onde adicionar validação específica de pergunta de preço.

**Verificação**
1. `npx jest src/tests/fluxos/fluxo5.test.ts` deve passar.
2. `npx jest src/tests/handlers/identificar-necessidade.handler.test.ts` deve passar.
3. Conferir que preço é tratado como dúvida no fluxo de identificação, sem quebrar outros estados de coleta ou aprovação.

**Decisão**
- Consertar no regex global de dúvida/preço é a abordagem mais rápida e alinhada aos handlers existentes, pois `IdentificarNecessidadeHandler` já usa `DUVIDA` para desviar para `ESCLARECER_DUVIDA`.
- Não é necessário alterar o fluxo de transição principal ou criar um novo estado, apenas ampliar a definição de dúvida.
