# [Frontend] Dashboard Admin (Fila de Novas OS)

## 📖 Descrição
A tela principal do app Flutter. Deve exibir uma lista ou Kanban das novas Ordens de Serviço que foram geradas pela IA e estão aguardando o contato da recepcionista (`status: AGUARDANDO_ORCAMENTO`).

## ✅ Critérios de Aceite (Definition of Done)
- [ ] App faz `GET /api/os?status=AGUARDANDO_ORCAMENTO` ao carregar a tela.
- [ ] Renderiza uma lista de cards contendo: Nome do Cliente, Produto.
- [ ] Possui um botão de "Atualizar" (Pull-to-refresh).
- [ ] Ao clicar em um card, navega para a rota de Detalhes da OS.

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Criar Model/DTO para mapear o JSON da OS.
- [ ] Implementar chamada HTTP na camada de repositório.
- [ ] Construir a UI usando `ListView.builder`.
- [ ] Tratar estado de erro ou fila vazia.

## 👤 Atribuição
**Responsável:** [A Definir]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 1 Dia útil.

## 🏷️ Etiquetas (Labels)
`frontend` `flutter` `ui` `milestone-3`

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 23.
- **Bloqueia:** Card 25.
