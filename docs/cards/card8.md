# [Integração] Fluxo Base Completo: Envio de Mensagem e Resposta Automática "Echo"

## 📖 Descrição
O encerramento do backend no Milestone 1 envolve a comprovação do ciclo inteiro. Para validar que o fluxo Mensagem -> Webhook -> Salvar Banco funciona e que nossa API tem a capacidade de responder de volta ao cliente, implementaremos uma resposta automática de confirmação de recebimento.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Todo o pipeline funciona sem interrupções e sem erros não tratados.
- [ ] Ao enviar uma mensagem de texto, ela é recebida pelo webhook e salva no banco (Cliente e Mensagem).
- [ ] O sistema chama a API de envio do WhatsApp e manda uma resposta automática genérica para o remetente (ex: "Sua mensagem foi recebida e registrada! Em breve nossa inteligência artificial responderá.").
- [ ] O fluxo obedece à regra da Meta respondendo 200 OK à requisição de recebimento rapidamente.

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Revisar código do Webhook (Controller e Service).
- [ ] Implementar serviço de envio de mensagem (`WhatsAppService.sendMessage()`) utilizando o Access Token da Meta e a API de `messages`.
- [ ] Colocar o acionamento desse envio ao final do processo de salvamento da mensagem no banco.
- [ ] Efetuar um teste fim-a-fim manual com acompanhamento dos logs.

## 👤 Atribuição
**Responsável:** [A Definir - Dev Backend]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 1 Dia útil.

## 🏷️ Etiquetas (Labels)
`backend` `whatsapp-api` `qa` `milestone-1`

## 🔗 Anexos ou Referências Técnicas
- [Enviar mensagens da Cloud API (Meta)](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages)

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 7 (Salvar Mensagem).
- **Bloqueia:** Milestone 2 (IA RAG).
