# [Backend] Implementação do Endpoint POST para Recepção de Mensagens

## 📖 Descrição
Com o webhook validado, a Meta passará a enviar requisições POST para a nossa URL sempre que um cliente enviar uma mensagem pelo WhatsApp. Precisamos criar o endpoint capaz de receber esse payload (JSON), extrair a mensagem e os dados do remetente, preparando o terreno para o armazenamento e IA futura.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Rota `POST /webhook` criada no backend.
- [ ] O endpoint deve fazer o parse do corpo da requisição (JSON).
- [ ] Extrair os dados cruciais: Número do cliente, Texto da mensagem e ID da mensagem.
- [ ] O servidor deve responder HTTP 200 OK imediatamente para evitar retentativas da Meta.
- [ ] Teste de envio de mensagem no WhatsApp ser capturado no console da aplicação local (`console.log`).

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Adicionar método POST no `WebhookController`.
- [ ] Garantir que o middleware de JSON parse (ex: `express.json()`) está ativo.
- [ ] Validar o schema do payload (garantir que existe `entry`, `changes`, `value`, `messages`).
- [ ] Isolar a extração dos dados (telefone, nome e corpo da mensagem) em um utility ou service simples.
- [ ] Responder com status 200 ao final do processamento síncrono.
- [ ] Realizar teste fim-a-fim disparando do aplicativo móvel real/teste.

## 👤 Atribuição
**Responsável:** [A Definir - Dev Backend]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 1 Dia útil.

## 🏷️ Etiquetas (Labels)
`backend` `whatsapp-api` `webhook` `milestone-1`

## 🔗 Anexos ou Referências Técnicas
- [Payload de Mensagem do WhatsApp](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples)

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 5 (Validação de Webhook).
- **Bloqueia:** Card 7 (Salvar mensagem no BD).
