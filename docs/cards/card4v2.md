# [Backend] Criação do Ambiente de Simulação (Mock WhatsApp Cloud API)

## 📖 Descrição
Devido ao bloqueio temporário na plataforma da Meta (Facebook Developers), não podemos conectar a API real. No entanto, o sistema não pode parar. Para fechar o **Milestone 1**, substituiremos a configuração da Meta por um **Ambiente de Mock**. O objetivo deste card é criar os artefatos de simulação (scripts de disparo e configuração de logs) para que o backend ache que está se comunicando com o WhatsApp real. Isso permitirá testar todos os fluxos de Webhook (GET/POST) e o ciclo completo de resposta.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Configuração de uma variável de ambiente no `.env` do backend (ex: `USE_MOCK_WHATSAPP=true`).
- [ ] Criação de um payload JSON de exemplo que imita a exata estrutura de mensagens da Meta.
- [ ] Criação de um script local (ou Postman Collection importável) capaz de disparar o `GET` (simulando a validação do token) e o `POST` (simulando a chegada de uma mensagem) para o `localhost:3000/webhook`.
- [ ] O serviço de envio de mensagens do nosso backend (que será criado no Card 8) deve ser arquitetado de forma que, se `USE_MOCK_WHATSAPP=true`, ele apenas imprima o envio no console do terminal em vez de tentar realizar requisições HTTP reais.

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Criar arquivo `mock_payloads.json` ou `simulate_webhook.http` na raiz do projeto contendo as estruturas da Cloud API.
- [ ] Adicionar as variáveis `WEBHOOK_VERIFY_TOKEN=dev_token_123` e `USE_MOCK_WHATSAPP=true` ao arquivo `.env` e `.env.example`.
- [ ] Criar o esqueleto base de um `WhatsAppService` que checa a variável `USE_MOCK_WHATSAPP` e imprime: `[MOCK WPP] Mensagem enviada para {numero}: {texto}`.
- [ ] Validar disparando os *mocks* contra o servidor (mesmo que ele ainda retorne 404, para provar que a estrutura do mock está pronta).

## 👤 Atribuição
**Responsável:** [A Definir - Dev Backend]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 0.5 Dia útil.

## 🏷️ Etiquetas (Labels)
`backend` `mock` `whatsapp-api` `qa` `milestone-1`

## 🔗 Anexos ou Referências Técnicas
- [Documentação Oficial de Payload do Webhook da Meta](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples)

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 3 (Setup Node.js).
- **Bloqueia/Substitui:** Desbloqueia diretamente o Card 5, Card 6 e Card 8 para serem testados com Mock.
