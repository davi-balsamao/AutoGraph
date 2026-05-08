# [IA/RAG] Ajustar Prompts para "Triagem e Transbordo"

## 📖 Descrição
Para o MVP, a IA não deve tentar fechar a venda nem dar preços finais. Ela precisa atuar exclusivamente na triagem, extraindo os dados dos produtos e, quando o pedido estiver claro, emitir uma mensagem de encerramento direcionando o atendimento para a recepcionista através de um novo número.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] System Prompt do LangChain atualizado, instruindo explicitamente a IA a atuar apenas como triador.
- [ ] IA finaliza o atendimento dizendo algo como: "Pedido anotado! Nossa equipe chamará em instantes pelo número X para passar valores."
- [ ] O fluxo identifica quando a IA atinge esse estado de "Transbordo/Finalizado" para engatilhar a criação da OS.

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Alterar prompt principal em `RagService` para focar na coleta dos `requisitos_orcamento`.
- [ ] Definir regra/output na IA (ex: retornar um JSON oculto `{"status": "pronto_para_os"}`) quando terminar as perguntas.
- [ ] Testar conversa simulando panfletos, validando que a IA encerra e não continua falando se o cliente insistir.

## 👤 Atribuição
**Responsável:** [A Definir]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 1 Dia útil.

## 🏷️ Etiquetas (Labels)
`ia` `langchain` `prompts` `milestone-3`

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 18 (Guardrails de Segurança concluído na M2).
- **Bloqueia:** Card 20.
