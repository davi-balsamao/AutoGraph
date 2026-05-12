# [Frontend] UI do Histórico de Conversa (Auditoria)

## 📖 Descrição
Uma área na tela de Detalhes da OS para a recepcionista ler o histórico da triagem feita pela IA e auditar se os dados extraídos estão corretos.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Uma seção ou aba separada chamada "Histórico do Atendimento".
- [ ] O app consome a API de histórico de mensagens.
- [ ] Renderiza uma lista de mensagens visualmente separadas (Cliente vs IA).
- [ ] Tela estática: sem campo para a recepcionista digitar.

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Chamar `GET /api/os/:id/mensagens`.
- [ ] Desenhar o componente `MessageBubble`.
- [ ] Alinhar bolhas (ex: Cliente na direita/esquerda, IA no lado oposto).

## 👤 Atribuição
**Responsável:** [A Definir]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 1 Dia útil.

## 🏷️ Etiquetas (Labels)
`frontend` `flutter` `ui` `milestone-3`

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 21 (API Histórico), Card 25 (Tela de Detalhes).
- **Bloqueia:** Nenhum.
