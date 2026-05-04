# [Backend/IA] Pipeline de Extração de Entidades do Pedido

## 📖 Descrição
Além de responder perguntas, a IA deve ser capaz de extrair informações estruturadas da conversa com o cliente para montar uma Ordem de Serviço automaticamente. Esta tarefa cria um pipeline de structured output que identifica e extrai as entidades necessárias do pedido: Tipo de Produto, Tamanho, Cor (colorido/P&B), Quantidade, Tipo de Papel/Gramatura e Arquivo (se enviado). O resultado é um objeto tipado que alimentará a criação automática de OS.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Classe/módulo `EntityExtractionService` criado em `backend/src/services/entity-extraction.service.ts`.
- [ ] Interface TypeScript definida para as entidades extraídas (ex: `PedidoEntities`).
- [ ] O LLM utiliza structured output (JSON mode ou function calling) para retornar dados tipados.
- [ ] Entidades extraídas: `tipoProduto`, `tamanho`, `cor`, `quantidade`, `tipoPapel`, `gramatura`, `arquivoRecebido`.
- [ ] Para cada entidade, o service indica se ela foi confirmada ou se está faltando (status parcial do pedido).
- [ ] Teste funcional: mensagem "Quero 500 cartões de visita coloridos em papel couchê 300g" extrai todas as entidades corretamente.
- [ ] Teste de entidade faltante: mensagem "Quero cartões de visita" retorna entidades parciais com indicação do que falta.

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Criar interface `PedidoEntities` em `backend/src/types/` ou dentro do service.
- [ ] Criar arquivo `backend/src/services/entity-extraction.service.ts`.
- [ ] Implementar prompt de extração com instruções detalhadas para o LLM (lista de entidades, formato esperado, valores válidos).
- [ ] Usar structured output do LangChain (ex: `StructuredOutputParser` ou `JsonOutputParser`).
- [ ] Implementar método `extract(conversationHistory: string): Promise<PedidoEntities>`.
- [ ] Adicionar lógica de verificação de completude (todas as entidades obrigatórias preenchidas?).
- [ ] Integrar no fluxo do `WebhookService` para rodar após a resposta do RAG.
- [ ] Testar com pelo menos 5 mensagens de pedido diferentes (completo, parcial, ambíguo).

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
