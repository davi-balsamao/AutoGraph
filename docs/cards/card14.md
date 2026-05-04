# [Backend/IA] Integrar IA no Fluxo de Mensagens do Webhook

## 📖 Descrição
Atualmente o `WebhookService.processIncomingMessage()` responde com uma mensagem de eco simples. Esta tarefa consiste em substituir esse comportamento pela chamada ao `RagService`, de modo que cada mensagem recebida via WhatsApp seja processada pela IA e respondida com conteúdo inteligente, gerado a partir da base de conhecimento da gráfica. Esta é a integração que conecta o pipeline de mensagens (Milestone 1) com o cérebro de IA (Milestone 2).

## ✅ Critérios de Aceite (Definition of Done)
- [ ] O `WebhookService` injeta e utiliza o `RagService` em vez do echo fixo.
- [ ] Ao receber uma mensagem via POST /webhook, a IA gera a resposta e ela é enviada de volta ao cliente via `WhatsAppService.sendMessage()`.
- [ ] O fluxo completo funciona: Mensagem WhatsApp → Webhook → Parse → Salva no BD → RAG processa → Resposta enviada ao cliente.
- [ ] Erros no processamento de IA são tratados gracefully (o cliente recebe uma mensagem genérica de fallback).
- [ ] O processamento de IA é assíncrono (não bloqueia a resposta HTTP 200 para a Meta).
- [ ] Logs registram: mensagem recebida, documentos recuperados pelo RAG, e resposta gerada.

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Modificar `backend/src/services/webhook.service.ts` para importar e instanciar o `RagService`.
- [ ] Substituir a chamada de echo pela chamada `ragService.query(messageText)`.
- [ ] Enviar a resposta da IA ao cliente via `whatsappService.sendMessage(from, aiResponse)`.
- [ ] Implementar bloco try-catch com mensagem de fallback caso a IA falhe.
- [ ] Garantir que o processamento é feito de forma assíncrona (fire-and-forget após o 200 OK).
- [ ] Salvar a resposta da IA no banco como uma nova `Mensagem` com `origem: BOT`.
- [ ] Testar o fluxo completo com mock do WhatsApp (`USE_MOCK_WHATSAPP=true`).
- [ ] Testar cenários de erro: API key inválida, timeout, base de conhecimento vazia.

## 👤 Atribuição
**Responsável:** [A Definir - Dev Backend/IA]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 1 Dia útil.

## 🏷️ Etiquetas (Labels)
`backend` `ia` `integração` `webhook` `prioridade-alta` `milestone-2`

## 🔗 Anexos ou Referências Técnicas
- [Código atual do WebhookService](../../backend/src/services/webhook.service.ts)
- [Relatório Milestone 1 - Seção 3.5 Ponto de Integração](../relatorios/relatorio_milestone1.md)

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 13 (RAG Chain implementada).
- **Bloqueia:** Card 15 (Pipeline de Extração de Entidades), Card 17 (Gerenciamento de Contexto).
