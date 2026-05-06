# [Backend/IA] Implementar RAG Chain (Retrieval-Augmented Generation)

## 📖 Descrição
Com a base de conhecimento vetorial alimentada, precisamos construir a chain de RAG que será o cérebro do atendimento de **Triagem**. A RAG Chain deve consultar o vector DB para encontrar os requisitos (perguntas) do produto desejado pelo cliente, e agir como um entrevistador. O LLM deve guiar a conversa até preencher todos os dados necessários. A IA **NÃO DEVE FORNECER PREÇOS**.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Classe/módulo `RagService` criado em `backend/src/services/rag.service.ts`.
- [ ] Método `query(question: string): Promise<string>` que executa o pipeline RAG completo: busca vetorial → contexto → geração de resposta.
- [ ] O retriever busca os top-K documentos mais similares na tabela `DocumentosConhecimento`.
- [ ] Prompt template configurado para instruir o LLM a atuar como triagem e PROIBIR a citação de qualquer valor monetário.
- [ ] Teste funcional: ao pedir "cartão de visita", a IA responde com as perguntas necessárias (quantidade, arte pronta, etc.) em vez de um preço.
- [ ] Respostas geradas não contêm números financeiros ou estimativas.

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Criar arquivo `backend/src/services/rag.service.ts`.
- [ ] Implementar retriever usando pgvector para busca por similaridade na tabela `DocumentosConhecimento`.
- [ ] Definir o número de documentos retornados (top-K, sugestão: K=3-5).
- [ ] Criar prompt template com instruções de sistema (persona de triagem, proibição de citar preços).
- [ ] Implementar a chain completa: query → embeddings da query → busca vetorial → montagem de contexto → LLM → resposta.
- [ ] Adicionar logs para debugging (documentos recuperados, prompt montado, resposta gerada).
- [ ] Testar com pelo menos 5 perguntas diferentes sobre produtos da gráfica.
- [ ] Validar que perguntas fora do escopo são respondidas com "não tenho essa informação".

## 👤 Atribuição
**Responsável:** [A Definir - Dev Backend/IA]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 2 Dias úteis.

## 🏷️ Etiquetas (Labels)
`backend` `ia` `rag` `langchain` `prioridade-alta` `milestone-2`

## 🔗 Anexos ou Referências Técnicas
- [LangChain RAG Tutorial](https://js.langchain.com/docs/tutorials/rag/)
- [LangChain RetrievalQAChain](https://js.langchain.com/docs/modules/chains/popular/vector_db_qa)
- [Relatório Milestone 1 - Ponto de integração](../relatorios/relatorio_milestone1.md)

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 11 (Setup LangChain), Card 12 (Base de Conhecimento).
- **Bloqueia:** Card 14 (Integrar IA no fluxo de mensagens), Card 18 (Guardrails de Preços).
