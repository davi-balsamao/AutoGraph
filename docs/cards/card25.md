# [Frontend] Detalhes da OS e Cópia de Mensagem

## 📖 Descrição
Tela acessada ao clicar numa OS. Mostra os dados extraídos pela IA e um bloco em destaque com a "Mensagem Sugerida" contendo um botão para copiá-la, facilitando a transição para o WhatsApp Web/Business da gráfica.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Exibe dados do cliente (Nome, Telefone) e da OS (Produto, Qtde, etc).
- [ ] Card com a "Mensagem Sugerida" (buscada da API).
- [ ] Botão "Copiar e Abrir WhatsApp" funcional.
- [ ] Botão para marcar OS como `FINALIZADA` ou `EM_PRODUCAO`.

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Consumir endpoint `GET /api/os/:id`.
- [ ] Utilizar o pacote `url_launcher` para abrir o link `wa.me/numero`.
- [ ] Utilizar `Clipboard.setData` para copiar a mensagem.
- [ ] Consumir `PATCH /api/os/:id/status` para fechar a OS e sumir da fila.

## 👤 Atribuição
**Responsável:** [A Definir]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 1 Dia útil.

## 🏷️ Etiquetas (Labels)
`frontend` `flutter` `ui` `milestone-3`

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 24.
- **Bloqueia:** Nenhum.
