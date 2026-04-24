# [Backend] Implementação do Endpoint GET para Validação de Webhook

## 📖 Descrição
A Meta exige que o Webhook seja validado antes de ser ativado. Para isso, o servidor precisa expor uma rota `GET` que recebe um `hub.challenge` e o devolve caso o `hub.verify_token` seja idêntico ao que cadastramos no painel da Meta. Sem isso, a comunicação WhatsApp -> Backend não acontece.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Rota `GET /webhook` (ou caminho similar) criada no backend.
- [ ] A rota verifica a assinatura baseada no `VERIFY_TOKEN` definido em variáveis de ambiente (`.env`).
- [ ] Em caso de token válido, devolve código HTTP 200 junto com o `hub.challenge`.
- [ ] Em caso de token inválido, devolve código HTTP 403 (Forbidden).
- [ ] Webhook configurado e validado com sucesso no painel da Meta (usando ngrok ou similar para expor porta local).

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Definir a variável `WEBHOOK_VERIFY_TOKEN` no `.env`.
- [ ] Criar o `WebhookController` para lidar com a rota GET.
- [ ] Implementar a lógica de validação conforme [documentação da Meta](https://developers.facebook.com/docs/graph-api/webhooks/getting-started).
- [ ] Adicionar a rota em `routes/index.ts` ou `webhook.routes.ts`.
- [ ] Subir uma URL pública temporária (ex: Ngrok/Localtunnel) e inserir no painel da Meta para validação.

## 👤 Atribuição
**Responsável:** [A Definir - Dev Backend]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 0.5 Dia útil.

## 🏷️ Etiquetas (Labels)
`backend` `whatsapp-api` `webhook` `milestone-1`

## 🔗 Anexos ou Referências Técnicas
- [Doc: Validação de Webhook da Meta](https://developers.facebook.com/docs/graph-api/webhooks/getting-started)

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 3 (Setup Backend), Card 4 (Setup Meta).
- **Bloqueia:** Card 6 (Recepção de Mensagens).
