# [Backend] Criação Automática de Ordem de Serviço (OS) via IA

## 📖 Descrição
Quando a IA identificar que todas as entidades obrigatórias de um pedido foram coletadas na conversa (Tipo de Produto, Tamanho, Quantidade, Tipo de Papel, etc.), o sistema deve automaticamente criar uma Ordem de Serviço na tabela `OrdensDeServico` do PostgreSQL. Esta tarefa implementa o `OsRepository` e a lógica no `WebhookService` que detecta a completude do pedido e persiste a OS, notificando o cliente via WhatsApp que seu pedido foi registrado.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] `OsRepository` criado em `backend/src/repositories/os.repository.ts` com métodos CRUD.
- [ ] Método `create()` persiste na tabela `OrdensDeServico` com `clienteId`, `status: CRIADA` e `especificacoes` (JSON com as entidades extraídas).
- [ ] O `WebhookService` detecta quando o `EntityExtractionService` retorna um pedido completo e aciona a criação da OS.
- [ ] Após criar a OS, o cliente recebe via WhatsApp uma confirmação: "Seu pedido #[ID] foi registrado com sucesso!".
- [ ] A OS é vinculada ao `Usuario` (cliente) correto via `clienteId`.
- [ ] A mensagem de confirmação da OS é salva no banco com `origem: BOT`.
- [ ] Teste funcional: simular conversa completa via webhook e verificar registro da OS no Prisma Studio.

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Criar arquivo `backend/src/repositories/os.repository.ts`.
- [ ] Implementar métodos: `create(data)`, `findById(id)`, `findByClienteId(clienteId)`, `updateStatus(id, status)`.
- [ ] Modificar `WebhookService` para verificar completude do pedido após extração de entidades.
- [ ] Implementar lógica condicional: se entidades completas → criar OS; se incompletas → IA pergunta o que falta.
- [ ] Formatar as `especificacoes` da OS como JSON estruturado com as entidades extraídas.
- [ ] Enviar mensagem de confirmação ao cliente com resumo do pedido e número da OS.
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
