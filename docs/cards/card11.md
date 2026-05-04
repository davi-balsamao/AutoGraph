# [Backend/IA] Setup do LangChain no Node.js

## 📖 Descrição
Para que o sistema AutoGraph consiga processar mensagens de clientes com inteligência artificial, precisamos instalar e configurar o framework LangChain dentro do backend Node.js. Esta tarefa envolve a instalação dos pacotes necessários (`langchain`, `@langchain/openai` ou `@langchain/google-genai`), a configuração do provider de LLM via variáveis de ambiente e a criação de um `AiService` base que servirá como ponto de entrada para todas as interações com a IA.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Pacotes `langchain` e o provider escolhido (`@langchain/openai` ou `@langchain/google-genai`) instalados no `package.json`.
- [ ] Variáveis de ambiente configuradas no `.env` e `.env.example` (`OPENAI_API_KEY` ou `GOOGLE_AI_API_KEY`, `LLM_MODEL`).
- [ ] Arquivo `AiService` criado em `backend/src/services/ai.service.ts` com método base para invocar o LLM.
- [ ] Teste manual: uma chamada simples ao LLM retorna resposta válida via console/log.
- [ ] A arquitetura Controller→Service→Repository é respeitada — a lógica de IA reside exclusivamente na camada de Services.

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Instalar dependências: `npm install langchain @langchain/openai` (ou provider equivalente).
- [ ] Adicionar variáveis `OPENAI_API_KEY` e `LLM_MODEL` ao `.env` e `.env.example`.
- [ ] Criar arquivo `backend/src/services/ai.service.ts` com classe/módulo `AiService`.
- [ ] Implementar método `chat(prompt: string): Promise<string>` que invoca o LLM configurado.
- [ ] Criar teste de sanidade: script ou endpoint temporário que envia um prompt fixo e imprime a resposta.
- [ ] Documentar no `.env.example` quais modelos são suportados.

## 👤 Atribuição
**Responsável:** [A Definir - Dev Backend/IA]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 1 Dia útil.

## 🏷️ Etiquetas (Labels)
`backend` `ia` `langchain` `setup` `prioridade-alta` `milestone-2`

## 🔗 Anexos ou Referências Técnicas
- [Documentação LangChain JS](https://js.langchain.com/docs/)
- [README.md - Seção de IA e Integrações](../../README.md)
- [Relatório Milestone 1 - Seção 3.5](../relatorios/relatorio_milestone1.md)

## 🔀 Relacionamento entre Cards
- **Depende de:** Milestone 1 concluída (Cards 1-10).
- **Bloqueia:** Card 12 (Alimentar Base de Conhecimento), Card 13 (Implementar RAG Chain).
