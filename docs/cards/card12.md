# [Backend/IA] Alimentar Base de Conhecimento (Vector DB)

## 📖 Descrição
Para que o sistema de Triagem (RAG) funcione com precisão, a base de conhecimento vetorial precisa ser alimentada com as regras de negócio da gráfica: quais produtos existem e **quais perguntas fazer para o cliente** (ex: tem arte?, quantidade?, acabamento?). Esta tarefa consiste em criar um script de ingestão que lê essas regras, divide em chunks, gera embeddings via API e popula a tabela `DocumentosConhecimento` (já criada na Milestone 1 com suporte a `pgvector`). A IA não lidará com preços.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Script de ingestão criado em `backend/src/scripts/` ou como comando npm (ex: `npm run seed:knowledge`).
- [ ] Documento de regras criado em `backend/data/catalogo.json` focado em perguntas obrigatórias por produto, **sem preços**.
- [ ] Documentos divididos em chunks com tamanho adequado (ex: 500-1000 tokens por chunk).
- [ ] Embeddings gerados via API (OpenAI ou Google) e armazenados na coluna `vetor` da tabela `DocumentosConhecimento`.
- [ ] Consulta de similaridade vetorial funcional: buscar "quero fazer cartão de visita" retorna as perguntas a serem feitas.
- [ ] Script é idempotente (pode rodar novamente sem duplicar dados).

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Criar pasta `backend/data/` com arquivo `catalogo.json` contendo as regras de triagem e perguntas para os produtos (sem preços).
- [ ] Instalar dependências de embeddings se necessário (ex: `@langchain/openai` para `OpenAIEmbeddings`).
- [ ] Criar script `backend/src/scripts/seed-knowledge.ts`.
- [ ] Implementar lógica de chunking (divisão dos documentos em partes menores).
- [ ] Implementar geração de embeddings para cada chunk.
- [ ] Persistir os chunks com seus embeddings na tabela `DocumentosConhecimento` via Prisma.
- [ ] Implementar limpeza prévia dos dados antigos (idempotência).
- [ ] Testar a busca por similaridade vetorial com uma query de exemplo usando SQL raw ou Prisma.

## 👤 Atribuição
**Responsável:** [A Definir - Dev Backend/IA]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 2 Dias úteis.

## 🏷️ Etiquetas (Labels)
`backend` `ia` `rag` `vector-db` `pgvector` `prioridade-alta` `milestone-2`

## 🔗 Anexos ou Referências Técnicas
- [Documentação pgvector](https://github.com/pgvector/pgvector)
- [LangChain Text Splitters](https://js.langchain.com/docs/modules/data_connection/document_transformers/)
- [Relatório Milestone 1 - Tabela DocumentosConhecimento](../relatorios/relatorio_milestone1.md)

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 11 (Setup LangChain).
- **Bloqueia:** Card 13 (Implementar RAG Chain), Card 18 (Guardrails e Validação de Preços).
