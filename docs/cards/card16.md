# [Backend] Criação Automática de Ordem de Serviço (OS) via IA

## 📖 Descrição
Quando a IA identificar que todas as entidades obrigatórias de um pedido foram coletadas (Tipo de Produto, Tamanho, Quantidade, Tipo de Papel, etc.), o sistema deve automaticamente criar um rascunho de Ordem de Serviço na tabela `OrdensDeServico` do PostgreSQL. Esta tarefa implementa o `OsRepository` e a lógica no `WebhookService` que detecta a completude do pedido, persiste a OS com status `AGUARDANDO_ORCAMENTO`, notifica a recepcionista para assumir o atendimento, e avisa o cliente que um humano irá lhe passar o preço.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] `OsRepository` criado em `backend/src/repositories/os.repository.ts` com métodos CRUD.
- [ ] Método `create()` persiste na tabela `OrdensDeServico` com `clienteId`, `status: AGUARDANDO_ORCAMENTO` e `especificacoes` (JSON com as entidades extraídas).
- [ ] O `WebhookService` detecta quando o `EntityExtractionService` retorna um pedido completo e aciona a criação da OS.
- [ ] Após criar a OS, o sistema gera uma notificação (no app ou via socket) para a Recepcionista assumir o atendimento.
- [ ] O cliente recebe via WhatsApp uma mensagem: "Tudo anotado! Vou passar para a nossa equipe e a recepcionista já vai lhe passar o orçamento."
- [ ] Quando a Recepcionista fechar a OS (status: PRODUCAO), um evento dispara o envio do link de login para o app do cliente.
- [ ] Teste funcional: simular conversa completa via webhook e verificar registro da OS como AGUARDANDO_ORCAMENTO no Prisma Studio.

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Criar arquivo `backend/src/repositories/os.repository.ts`.
- [ ] Implementar métodos: `create(data)`, `findById(id)`, `findByClienteId(clienteId)`, `updateStatus(id, status)`.
- [ ] Modificar `WebhookService` para verificar completude do pedido após extração de entidades.
- [ ] Implementar lógica condicional: se entidades completas → criar OS (AGUARDANDO_ORCAMENTO) e transbordo; se incompletas → IA pergunta o que falta.
- [ ] Formatar as `especificacoes` da OS como JSON estruturado.
- [ ] Enviar mensagem ao cliente informando que a equipe fará o orçamento.
- [ ] Preparar hook/evento para quando o status mudar de AGUARDANDO_ORCAMENTO para PRODUCAO enviar o link do app para o cliente.
- [ ] Salvar mensagem de confirmação no banco com `origem: BOT`.
- [ ] Testar criação de OS via mock do WhatsApp e verificar no Prisma Studio.

## 👤 Atribuição
**Responsável:** [A Definir - Dev Backend]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 1 Dia útil.

## 🏷️ Etiquetas (Labels)
`backend` `repositório` `ordem-de-serviço` `integração` `prioridade-alta` `milestone-2`

## 🔗 Anexos ou Referências Técnicas
- [Schema Prisma - Tabela OrdensDeServico](../../backend/prisma/schema.prisma)
- [Relatório Milestone 1 - Arquitetura do Backend](../relatorios/relatorio_milestone1.md)

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 15 (Pipeline de Extração de Entidades).
- **Bloqueia:** Milestone 3 (Telas de acompanhamento de OS no Flutter).
