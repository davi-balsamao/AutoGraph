## Plan: Corrigir fluxo 4 — cálculo expresso em VALIDAR_ARQUIVO

TL;DR: O fluxo falha porque o estado `VALIDAR_ARQUIVO` só reconhece confirmação de arte ou pedidos de envio depois, mas não trata uma pergunta de custo/entrega expressa como sinal para avançar ao cálculo. A correção é adicionar reconhecimento de intenção de orçamento dentro desse handler e deixar o bot seguir para `CALCULAR_ORCAMENTO`/`APRESENTAR_ORCAMENTO`.

**Steps**
1. Confirmar o escopo do bug em `backend/src/fsm/handlers/validar-arquivo.handler.ts` e `backend/src/fsm/transition.service.ts`.
2. Implementar um novo ramo no handler `ValidarArquivoHandler`:
   - Definir regex para perguntas de custo/preço/orçamento e entrega expressa.
   - Quando detectar esse padrão em `VALIDAR_ARQUIVO`, retornar `nextState: ConversationState.CALCULAR_ORCAMENTO` com `chainNext: ConversationState.CALCULAR_ORCAMENTO`.
   - Opcionalmente, manter `context.validacaoArteOk` ou outro indicador de que o fluxo segue para cálculo.
3. Ajustar a transição se necessário (em `TransitionService`) para aceitar a mesma intenção no estado `VALIDAR_ARQUIVO`.
4. Adicionar regressão de teste:
   - Em `backend/src/tests/handlers/validar-arquivo.handler.test.ts`, incluir caso que verifica o avanço para `CALCULAR_ORCAMENTO` ao receber "Qual o custo...".
   - Validar o fluxo completo com `backend/src/tests/fluxos/fluxo4.test.ts`.
5. Verificação final:
   - Rodar `npx jest src/tests/fluxos/fluxo4.test.ts`
   - Rodar `npx jest src/tests/handlers/validar-arquivo.handler.test.ts`

**Relevant files**
- `backend/src/fsm/handlers/validar-arquivo.handler.ts` — corrigir a lógica de intenção e transição em `VALIDAR_ARQUIVO`.
- `backend/src/fsm/transition.service.ts` — revisar se o `VALIDAR_ARQUIVO` depende de regras adicionais para avançar.
- `backend/src/tests/handlers/validar-arquivo.handler.test.ts` — adicionar teste de regressão para custo expresso.
- `backend/src/tests/fluxos/fluxo4.test.ts` — fluxo de aceitação atual.

**Verification**
1. `npx jest src/tests/fluxos/fluxo4.test.ts` deve passar com o estado avançando para `AGUARDAR_APROVACAO` após a pergunta de custo expresso.
2. `npx jest src/tests/handlers/validar-arquivo.handler.test.ts` deve incluir e passar o novo caso de custo/orçamento.
3. Conferir logs do fluxo para garantir que o bot não repete a pergunta de arquivo quando o cliente já pede orçamento.

**Decisions / causas identificadas**
- Causa principal: `ValidarArquivoHandler` não reconhece intenção de orçamento em `VALIDAR_ARQUIVO`.
- Causa associada: `TransitionService` também só permite sair de `VALIDAR_ARQUIVO` quando a mensagem é um "sim"/confirmção de arte.
- O teste de fluxo 4 revela uma expectativa de produto: o cliente pode pedir "Qual o custo para entrega expressa em 24 horas?" sem precisar primeiro dizer explicitamente que tem o arquivo pronto.

**Further considerations**
1. Se for necessário, podemos limitar o novo regex para evitar transições em mensagens genéricas de custo que ainda não têm specs completas.
2. Poderemos manter a pergunta de arquivo como fallback apenas quando não houver indicação clara de orçamento.
