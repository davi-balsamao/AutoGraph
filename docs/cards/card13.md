# [Backend/IA] Implementar RAG Chain (Retrieval-Augmented Generation)

## 📖 Descrição
Com a base de conhecimento vetorial alimentada, precisamos construir a chain de RAG que será o cérebro do atendimento. A RAG Chain deve consultar o vector DB para encontrar documentos relevantes à pergunta do cliente e usar o LLM para gerar uma resposta precisa e contextualizada, fundamentada nos dados reais da gráfica (preços, prazos, materiais). A IA não deve inventar informações — deve sempre se basear nos documentos recuperados.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Classe/módulo `RagService` criado em `backend/src/services/rag.service.ts`.
- [ ] Método `query(question: string): Promise<string>` que executa o pipeline RAG completo: busca vetorial → contexto → geração de resposta.
- [ ] O retriever busca os top-K documentos mais similares na tabela `DocumentosConhecimento`.
- [ ] Prompt template configurado para instruir o LLM a responder APENAS com base nos documentos recuperados.
- [ ] Teste funcional: pergunta "Qual o preço de 500 cartões de visita em papel couchê?" retorna resposta com preço correto extraído da base de conhecimento.
- [ ] Respostas geradas não contêm alucinações (preços, prazos ou materiais inventados).

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Criar arquivo `backend/src/services/rag.service.ts`.
- [ ] Implementar retriever usando pgvector para busca por similaridade na tabela `DocumentosConhecimento`.
- [ ] Definir o número de documentos retornados (top-K, sugestão: K=3-5).
- [ ] Criar prompt template com instruções de sistema (persona da gráfica, restrição de alucinação).
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
