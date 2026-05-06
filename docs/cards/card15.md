# [Backend/IA] Pipeline de Extração de Entidades do Pedido

## 📖 Descrição
Durante a triagem, a IA deve extrair as informações que o cliente está passando para montar a Ordem de Serviço automaticamente. Esta tarefa cria um pipeline de structured output que identifica o **Tipo de Produto** e, baseado nele, extrai as respostas para os **Requisitos de Orçamento** desse produto. O resultado é um objeto tipado que alimentará a criação automática da OS.

## ✅ Critérios de Aceite (Definition of Done)
- [x] Classe/módulo `EntityExtractionService` criado em `backend/src/services/entity-extraction.service.ts`.
- [x] Interface TypeScript flexível definida para as entidades extraídas (produto, dados preenchidos, dados faltantes).
- [x] O LLM utiliza structured output (JSON mode ou function calling) para retornar dados tipados de acordo com os requisitos dinâmicos do produto.
- [x] Para cada requisito do produto, o service indica se ele foi preenchido ou se está faltando (status parcial do pedido).
- [x] Teste funcional: mensagem "Quero 500 cartões de visita coloridos em papel couchê 300g" extrai as entidades correspondentes aos requisitos de cartão de visita.
- [x] O WebhookService deve verificar esse retorno. Se estiver completo, encerra a triagem e notifica a recepcionista. Se não, a IA continua perguntando.

## 🛠️ Checklist de Tarefas Técnicas
- [x] Criar interface flexível `PedidoEntities` em `backend/src/types/` ou dentro do service, permitindo chaves dinâmicas baseadas nos requisitos.
- [x] Criar arquivo `backend/src/services/entity-extraction.service.ts`.
- [x] Implementar prompt de extração com instruções para mapear a conversa do usuário contra os requisitos do produto recuperado do banco.
- [x] Usar structured output do LangChain (ex: `StructuredOutputParser` ou `JsonOutputParser`).
- [x] Implementar método `extract(conversationHistory: string, requirements: string[]): Promise<PedidoEntities>`.
- [x] Adicionar lógica de verificação de completude (todos os requisitos do catálogo preenchidos?).
- [x] Integrar no fluxo do `WebhookService` para rodar junto com o RAG.
- [x] Testar com pelo menos 5 mensagens de pedido diferentes.

## 👤 Atribuição
**Responsável:** [A Definir - Dev Backend/IA]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 2 Dias úteis.

## 🏷️ Etiquetas (Labels)
`backend` `ia` `extração` `structured-output` `prioridade-alta` `milestone-2`

## 🔗 Anexos ou Referências Técnicas
- [LangChain Structured Output](https://js.langchain.com/docs/modules/model_io/output_parsers/)
- [Tabela OrdensDeServico - campo especificacoes](../relatorios/relatorio_milestone1.md)

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 14 (IA integrada no fluxo de mensagens).
- **Bloqueia:** Card 16 (Criação automática de OS).
