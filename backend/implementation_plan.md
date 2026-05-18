# Migração do RAG para Arquitetura de Estados de Máquina

## Contexto e Objetivo

O RAG atual do AutoGraph é um pipeline **stateless** de recuperação + geração: toda mensagem é tratada isoladamente, o LLM recebe o histórico bruto como contexto e tenta inferir "onde está" a conversa. O novo esquema de `rag-test/estados/` propõe uma **Máquina de Estados Finita (FSM)** explícita com 16 estados bem definidos e 20 fluxos mapeados.

A migração precisa introduzir a FSM **sem quebrar** o webhook, o sistema de OS, a API do WhatsApp e o painel admin que já existem.

---

## Diagnóstico do RAG Atual

### O que funciona bem (deve ser preservado)

| Componente | Arquivo | Mantém? |
|---|---|---|
| Busca vetorial pgvector com threshold | `rag.service.ts` L76–96 | ✅ Sim |
| Guardrails de preços e escopo | `guardrails.service.ts` | ✅ Sim |
| `stripDoubleNewlines` para WhatsApp | `rag.service.ts` L41–43 | ✅ Sim |
| Silenciamento de IA em atendimento humano | `webhook.service.ts` L44–47 | ✅ Sim |
| ConversationService / histórico formatado | `conversation.service.ts` | ✅ Sim |
| Deduplicação de mensagens (webhook) | `webhook.service.ts` | ✅ Sim |

### Problemas estruturais atuais

| Problema | Impacto |
|---|---|
| **Sem estado explícito**: o LLM infere onde está pela conversa | Alucinação de fluxo — pode perguntar quantidade antes de confirmar produto |
| **EntityExtraction por heurísticas de regex**: frágil para linguagem natural | Falsos negativos frequentes — `entities.completo` raramente `true` |
| **Transbordo precoce/inexistente**: OS só é gerada quando `entities.completo = true` via regex | Nunca gera OS de forma confiável |
| **`CALCULAR_ORCAMENTO` inexistente**: o bot menciona preços que o guardrail bloqueia | Fluxo quebrado — o prompt não sabe que NÃO deve calcular, apenas coletar |
| **Sem persistência de estado**: se o servidor reiniciar, a sessão perde o progresso | Inconsistência de atendimento |
| **Uma pergunta por mensagem**: o prompt atual tem "Máximo 2 ou 3 perguntas por vez" | Contradiz regra geral #2 do novo esquema |

---

## Brechas no Esquema Novo (Estados)

> [!WARNING]
> Estas são lacunas detectadas nos arquivos de `rag-test/` que precisam de decisão antes da implementação.

### Brecha 1 — Estado `CALCULAR_ORCAMENTO` é interno, mas quem calcula?
**[RESOLVIDO]** O cálculo de orçamento será feito internamente pelo bot. A tabela de preços foi fornecida em `data/tabela_precos_grafica.md`. O sistema fornecerá este arquivo como contexto para que a IA faça o orçamento com base nas regras estipuladas antes de avançar para a apresentação do valor.

### Brecha 2 — `AGUARDAR_RETORNO` precisa de scheduler externo
**[RESOLVIDO]** Foi adicionado um job scheduler simples e funcional usando `node-cron` (`src/services/cron.service.ts`). Ele atuará de 5 em 5 minutos verificando inatividade para enviar o lembrete de 30 min e fazer o encerramento em 24h. *(Nota técnica: durante a execução, o cron será levemente adaptado para ler do novo modelo de Sessões que criaremos no Prisma).*

### Brecha 3 — Retorno de `ESCLARECER_DUVIDA` para estado anterior
O estado `esclarecer-duvida.md` diz _"Retoma onde estava"_. Isso requer que o contexto salve um campo `estadoAnterior` além do `estadoAtual`. O esquema atual de estados não menciona essa estrutura de stack.

**Sugestão:** O contexto de estado precisa de um campo `previousState` ou uma mini-pilha `stateStack` para suportar esse retorno.

### Brecha 4 — `VALIDAR_ARQUIVO` implica receber binário via WhatsApp
O estado `validar-arquivo.md` checa resolução, formato e dimensões. A API do WhatsApp entrega imagens e PDFs como media IDs, não como arquivos locais. O código atual não tem nenhum handler de media.

**Pergunta:** A validação de arte vai ser feita pelo bot automaticamente (baixar e analisar o arquivo), ou o bot apenas pergunta se a arte está dentro das especificações técnicas?

### Brecha 5 — `GERAR_OS` sem confirmação de pagamento
O fluxo 1 (fluxo base) vai direto de `GERAR_OS` para `ENCERRAR`. Não há estado de cobrança/pagamento. Se a O.S. for gerada, o cliente recebe o número e encerra — mas como vai pagar?

**Pergunta:** O pagamento é tratado fora do bot (manualmente pela equipe)?

### Brecha 6 — `NEGOCIAR` sem margem de desconto no codebase
**[RESOLVIDO]** As regras de negociação foram claramente definidas em `data/diretrizes_negociacao.md` (ex: limites de 5% e 10% dependendo do valor da compra). A IA receberá essas diretrizes como conhecimento e conduzirá a negociação respeitando essas margens e argumentos de venda estabelecidos.

### Brecha 7 — `ENCERRAR` → `BOAS_VINDAS` sem prazo/isolamento de sessão
Após `ENCERRAR`, o estado `encerrar.md` diz _"Nova mensagem = novo atendimento"_. Mas o código atual carrega todo o histórico de mensagens do cliente. Um cliente que já pediu 3x terá histórico de 3 atendimentos misturado.

**Sugestão:** A FSM precisa de um conceito de **sessão** (com `sessionId` ou `criadoEm`) separado do `clienteId`. Cada `BOAS_VINDAS` inicia uma nova sessão.

---

## Arquitetura Proposta

```
webhook.service.ts
     │
     ▼
StateService (NOVO)          ← lê/grava estado atual + contexto do cliente
     │
     ├── StateRouter (NOVO)  ← decide qual handler de estado executar
     │        │
     │        ├── BoasVindasHandler
     │        ├── IdentificarNecessidadeHandler
     │        ├── ColetarEspecHandler
     │        ├── ValidarArquivoHandler
     │        ├── CalcularOrcamentoHandler
     │        ├── ... (um handler por estado)
     │        └── EscalarHumanoHandler
     │
     ├── RagService (existente, MANTIDO)  ← chamado pelos handlers que precisam de KB
     ├── GuardrailsService (existente, MANTIDO)
     └── ConversationService (existente, MANTIDO)
```

---

## Plano de Ação — Fases

### Fase 0 — Prerequisitos (antes de tocar no código)

- [ ] Responder as 6 brechas acima
- [ ] Decidir onde o estado vai ser persistido: **opção A** — Redis (melhor), **opção B** — tabela nova no Postgres (mais simples, sem nova dep)

> [!IMPORTANT]
> Recomendo **Opção B (Postgres)**: já tem o Prisma configurado, sem nova dependência. Redis só valeria se precisar de expiração automática de sessão (TTL), que é útil mas não crítico para MVP.

---

### Fase 1 — Persistência de Estado (sem quebrar nada)

#### [NEW] `prisma/schema.prisma` — adicionar model `SessaoAtendimento`
```prisma
model SessaoAtendimento {
  id           String   @id @default(uuid())
  clienteId    String
  cliente      Cliente  @relation(fields: [clienteId], references: [id])
  estadoAtual  String   @default("BOAS_VINDAS")
  estadoAnterior String? // para retorno do ESCLARECER_DUVIDA
  contexto     Json     @default("{}")  // campos coletados: produto, specs, entrega...
  ativa        Boolean  @default(true)
  criadoEm     DateTime @default(now())
  atualizadoEm DateTime @updatedAt
}
```

#### [NEW] `src/repositories/sessao.repository.ts`
CRUD para `SessaoAtendimento`: `findActiveByClienteId`, `create`, `updateState`, `updateContexto`, `encerrar`.

#### [NEW] `src/services/state.service.ts`
Responsável por:
- Buscar sessão ativa do cliente (ou criar nova em `BOAS_VINDAS`)
- Gravar transição de estado
- Manter `contexto` (objeto acumulado com `produto`, `specs`, `entrega`, etc.)

**Compatibilidade**: o `webhook.service.ts` não muda nesta fase. O `StateService` pode ser importado mas ainda não usado.

---

### Fase 2 — State Router e Handlers (núcleo da FSM)

#### [NEW] `src/fsm/states.ts`
Enum com todos os 16 estados + tipo para o contexto acumulado:
```typescript
export enum ConversationState {
  BOAS_VINDAS = 'BOAS_VINDAS',
  IDENTIFICAR_NECESSIDADE = 'IDENTIFICAR_NECESSIDADE',
  COLETAR_ESPECIFICACOES = 'COLETAR_ESPECIFICACOES',
  VALIDAR_ARQUIVO = 'VALIDAR_ARQUIVO',
  CALCULAR_ORCAMENTO = 'CALCULAR_ORCAMENTO',
  APRESENTAR_ORCAMENTO = 'APRESENTAR_ORCAMENTO',
  AGUARDAR_APROVACAO = 'AGUARDAR_APROVACAO',
  NEGOCIAR = 'NEGOCIAR',
  COLETAR_DADOS_ENTREGA = 'COLETAR_DADOS_ENTREGA',
  CONFIRMAR_PEDIDO = 'CONFIRMAR_PEDIDO',
  GERAR_OS = 'GERAR_OS',
  ESCLARECER_DUVIDA = 'ESCLARECER_DUVIDA',
  PRODUTO_INDISPONIVEL = 'PRODUTO_INDISPONIVEL',
  ESCALAR_HUMANO = 'ESCALAR_HUMANO',
  AGUARDAR_RETORNO = 'AGUARDAR_RETORNO',
  ENCERRAR = 'ENCERRAR',
}

export interface ConversationContext {
  produto?: string;
  specs?: Record<string, string>;      // campo → resposta
  specsPendentes?: string[];           // campos que faltam
  orcamento?: { total: number; prazo: string; validade: string };
  entrega?: { modalidade: 'retirada' | 'entrega'; endereco?: string };
  osId?: string;
}
```

#### [NEW] `src/fsm/handlers/` — um arquivo por estado
Cada handler implementa a interface:
```typescript
interface StateHandler {
  handle(
    message: string,
    context: ConversationContext,
    ragService: RagService
  ): Promise<{ response: string; nextState: ConversationState; updatedContext: ConversationContext }>;
}
```

Handlers a criar (em ordem de prioridade de fluxo):
1. `boas-vindas.handler.ts`
2. `identificar-necessidade.handler.ts`
3. `coletar-especificacoes.handler.ts`
4. `calcular-orcamento.handler.ts`
5. `apresentar-orcamento.handler.ts`
6. `aguardar-aprovacao.handler.ts`
7. `dados-entrega.handler.ts`
8. `confirmar-pedido.handler.ts`
9. `gerar-os.handler.ts`
10. `encerrar.handler.ts`
11. `esclarecer-duvida.handler.ts`
12. `produto-indisponivel.handler.ts`
13. `negociar.handler.ts`
14. `escalar-humano.handler.ts`
15. `aguardar-retorno.handler.ts`
16. `validar-arquivo.handler.ts`

#### [NEW] `src/fsm/state-router.ts`
Mapeia `ConversationState` → handler correspondente e executa.

---

### Fase 3 — Adaptação do RAG Template por Estado

#### [MODIFY] `src/services/rag-template.ts`
O prompt atual é genérico. Na arquitetura de estados, o **System Prompt deve variar por estado**. Proposta: criar uma função `buildSystemPrompt(state: ConversationState, context: ConversationContext): string` que injeta:
- O estado atual e o objetivo dele
- As regras gerais aplicáveis
- As transições permitidas
- O contexto acumulado (`specs` já coletadas, produto identificado, etc.)

Isso permite que o LLM saiba exatamente o que precisa fazer e o que NÃO deve fazer em cada turno.

---

### Fase 4 — Integração no Webhook (troca do pipeline)

#### [MODIFY] `src/services/webhook.service.ts`
Substituir o bloco de `ragService.query()` + `entityExtractionService.extract()` por:
```typescript
const sessao = await stateService.getOrCreateSession(cliente.id);
const result = await stateRouter.route(sessao, messageData.text);
await stateService.transition(sessao.id, result.nextState, result.updatedContext);
aiResponse = result.response;

// OS continua sendo gerada pelo GearOsHandler, não mais pelo entityExtraction
```

O `EntityExtractionService` pode ser **descontinuado** gradualmente após a FSM estar estável. Sugiro manter por 1 sprint como fallback.

---

### Fase 5 — Migração do Prompt Template (rag-template.ts)

Atualizar as regras hardcoded no prompt para alinhar com as regras gerais:
- Remover "Máximo 2 ou 3 perguntas por vez" → substituir por "UMA pergunta por mensagem"
- Remover regra de saudação hardcoded → delegar ao `BoasVindasHandler`
- Manter guardrail de preços, escopo e prompt injection

---

### Fase 6 — Scheduler para `AGUARDAR_RETORNO` (opcional/MVP)

Se decidir implementar:
- **node-cron** (zero dependência extra além do npm): cron job que roda a cada 5 min, busca sessões em `AGUARDAR_RETORNO` com `atualizadoEm` > 30 min e envia lembrete
- Ou **BullMQ + Redis** para produção escalável

---

## Tabela de Compatibilidade das Mudanças

| O que muda | Risco de quebra | Mitigação |
|---|---|---|
| Novo model Prisma `SessaoAtendimento` | Baixo (migração aditiva) | `prisma migrate` sem alterar modelos existentes |
| Novo `StateService` + `StateRouter` | Baixo (novo código) | Feature flag ou env var para ativar/desativar |
| `webhook.service.ts` — troca do pipeline | **Alto** | Testar em ambiente de dev antes de prod; manter EntityExtraction como fallback |
| `rag-template.ts` — prompt por estado | Médio | Comparar respostas do antes/depois com mesmas perguntas |
| `entity-extraction.service.ts` — descontinuar | Baixo (gradual) | Manter arquivo, só não chamar mais |

---

## Perguntas em Aberto (necessárias antes de executar)

> [!IMPORTANT]
> Responda antes de iniciar qualquer implementação:

1. **Validação de arte (Brecha 4)**: o bot vai baixar e analisar o arquivo (verificar dimensão em pixels), ou apenas perguntar as specs da arte para o cliente verbalmente?
2. **Pagamento (Brecha 5)**: tratado fora do bot (manualmente)? O `GERAR_OS` → `ENCERRAR` sem passo de cobrança é intencional?
3. **Sessões (Brecha 7)**: cada `ENCERRAR` cria nova sessão — isso significa que o histórico de conversa no `ConversationService` deve ser filtrado por `sessaoId`, ou mantém o histórico global misturado?
4. **Brecha 3**: (Opcional responder, posso implementar) Sugiro adicionar o campo `estadoAnterior` no Prisma para o estado `ESCLARECER_DUVIDA` funcionar corretamente. Podemos prosseguir com essa sugestão?

---

## Verificação

### Fluxo de teste manual (Fluxo 1)
1. Enviar "Oi" → bot responde com boas-vindas, estado: `BOAS_VINDAS`
2. Enviar "Quero orçamento de panfleto" → estado: `IDENTIFICAR_NECESSIDADE` → `COLETAR_ESPECIFICACOES`
3. Responder specs uma por uma (formato, gramatura, qtd...) → estado permanece `COLETAR_ESPECIFICACOES`
4. Enviar arte → estado: `VALIDAR_ARQUIVO`
5. Arte válida → `CALCULAR_ORCAMENTO` → `APRESENTAR_ORCAMENTO`
6. "Aceito" → `AGUARDAR_APROVACAO` → `COLETAR_DADOS_ENTREGA`
7. Endereço → `CONFIRMAR_PEDIDO`
8. "Confirmo" → `GERAR_OS` → `ENCERRAR`

### Testes de regressão
- Garantir que `atendimentoHumano = true` ainda silencia a IA
- Garantir que guardrail de preços ainda funciona
- Garantir que Socket.IO emite `nova-os` corretamente pelo novo handler
