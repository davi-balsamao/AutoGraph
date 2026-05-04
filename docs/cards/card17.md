# [Backend/IA] Gerenciamento de Contexto de Conversa (Memória)

## 📖 Descrição
Atualmente, cada mensagem recebida é processada de forma isolada — a IA não tem memória do que o cliente disse anteriormente. Para um atendimento eficaz, o bot precisa manter o contexto da conversa entre mensagens, permitindo diálogos multi-turno como: "Quero cartões de visita" → "Quantos?" → "500" → "Colorido ou P&B?". Esta tarefa implementa um sistema de memória de conversação que recupera o histórico de mensagens do banco e injeta como contexto no prompt do LLM.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] O sistema recupera as últimas N mensagens do cliente do banco de dados antes de processar uma nova mensagem.
- [ ] O histórico de conversa é formatado e injetado no prompt do LLM como contexto.
- [ ] O bot mantém coerência entre mensagens (ex: cliente diz "quero cartões" → depois diz "500 unidades" → IA entende que são 500 cartões).
- [ ] Limite de histórico configurável via variável de ambiente (ex: `CONVERSATION_HISTORY_LIMIT=20`).
- [ ] A memória funciona por cliente (cada cliente tem seu próprio histórico isolado).
- [ ] Teste funcional: simular diálogo em múltiplos POSTs ao webhook e verificar que a IA mantém contexto.

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Criar método `findByUsuarioId(usuarioId, limit)` no `MensagemRepository` para buscar histórico.
- [ ] Criar `ConversationService` em `backend/src/services/conversation.service.ts` ou integrar ao `AiService`.
- [ ] Implementar formatação do histórico para o formato esperado pelo LLM (ex: `[{role: 'user', content: '...'}, {role: 'assistant', content: '...'}]`).
- [ ] Modificar o `RagService` para aceitar o histórico de conversa como parâmetro adicional.
- [ ] Atualizar o prompt template para incluir o histórico de conversa.
- [ ] Adicionar variável `CONVERSATION_HISTORY_LIMIT` ao `.env` e `.env.example`.
- [ ] Testar cenário de conversa multi-turno (mínimo 3 mensagens consecutivas com contexto).
- [ ] Testar isolamento entre clientes diferentes (histórico não vaza entre clientes).

## 👤 Atribuição
**Responsável:** [A Definir - Dev Backend/IA]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 2 Dias úteis.

## 🏷️ Etiquetas (Labels)
`backend` `ia` `memória` `conversação` `langchain` `milestone-2`

## 🔗 Anexos ou Referências Técnicas
- [LangChain Memory](https://js.langchain.com/docs/modules/memory/)
- [MensagemRepository existente](../../backend/src/repositories/mensagem.repository.ts)

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 14 (IA integrada no fluxo de mensagens).
- **Bloqueia:** Nenhum diretamente (melhoria de qualidade da IA).
