# [Backend] Adicionar Fluxo de "Aprovação/Finalização" na OS

## 📖 Descrição
Para que a recepcionista limpe a fila no App Flutter, precisamos de um endpoint que mude o status da OS de `AGUARDANDO_ORCAMENTO` para `FINALIZADA` ou `EM_PRODUCAO`.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Endpoint `PATCH /api/os/:id/status` criado.
- [ ] Atualiza o banco de dados e retorna a OS atualizada.
- [ ] OS finalizadas não devem aparecer na fila padrão do Dashboard (filtragem).

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Implementar rota no Express.
- [ ] Adicionar método no `OsRepository`.
- [ ] Garantir que o `GET /api/os` possua query param `?status=AGUARDANDO_ORCAMENTO` funcionando.

## 👤 Atribuição
**Responsável:** [A Definir]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 0.5 Dia útil.

## 🏷️ Etiquetas (Labels)
`backend` `api` `milestone-3`

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 16 (Geração de OS M2).
- **Bloqueia:** Nenhum.
