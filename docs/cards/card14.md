# [Backend/IA] Integrar IA no Fluxo de Mensagens do Webhook

## 📖 Descrição
Atualmente o `WebhookService.processIncomingMessage()` responde com uma mensagem de eco simples. Esta tarefa consiste em substituir esse comportamento pela chamada ao `RagService`, de modo que cada mensagem recebida via WhatsApp seja processada pela IA e respondida com conteúdo inteligente, gerado a partir da base de conhecimento da gráfica. Esta é a integração que conecta o pipeline de mensagens (Milestone 1) com o cérebro de IA (Milestone 2).

## ✅ Critérios de Aceite (Definition of Done)
- [x] O `WebhookService` injeta e utiliza o `RagService` em vez do echo fixo.
- [x] Ao receber uma mensagem via POST /webhook, a IA gera a resposta e ela é enviada de volta ao cliente via `WhatsAppService.sendMessage()`.
- [x] O fluxo completo funciona: Mensagem WhatsApp → Webhook → Parse → Salva no BD → RAG processa → Resposta enviada ao cliente.
- [x] Erros no processamento de IA são tratados gracefully (o cliente recebe uma mensagem genérica de fallback).
- [x] O processamento de IA é assíncrono (não bloqueia a resposta HTTP 200 para a Meta).
- [x] Logs registram: mensagem recebida, documentos recuperados pelo RAG, e resposta gerada.

## 🛠️ Checklist de Tarefas Técnicas
- [x] Modificar `backend/src/services/webhook.service.ts` para importar e instanciar o `RagService`.
- [x] Substituir a chamada de echo pela chamada `ragService.query(messageText)`.
- [x] Enviar a resposta da IA ao cliente via `whatsappService.sendMessage(from, aiResponse)`.
- [x] Implementar bloco try-catch com mensagem de fallback caso a IA falhe.
- [x] Garantir que o processamento é feito de forma assíncrona (fire-and-forget após o 200 OK).
- [x] Salvar a resposta da IA no banco como uma nova `Mensagem` com `origem: BOT`.
- [x] Testar o fluxo completo com mock do WhatsApp (`USE_MOCK_WHATSAPP=true`).
- [x] Testar cenários de erro: API key inválida, timeout, base de conhecimento vazia.

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
