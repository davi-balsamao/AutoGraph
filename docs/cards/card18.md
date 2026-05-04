# [Backend/IA] Guardrails e Validação de Preços

## 📖 Descrição
Um dos riscos críticos de usar IA generativa em contexto comercial é a alucinação de preços — o LLM pode inventar valores que não existem na tabela real da gráfica. Esta tarefa implementa uma camada de validação (guardrails) que verifica as respostas da IA contra os dados reais da base de conhecimento, garantindo que nenhum preço, prazo ou material inventado chegue ao cliente. Também define limites de escopo para que a IA não responda perguntas fora do contexto da gráfica.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Serviço de validação criado em `backend/src/services/guardrails.service.ts`.
- [ ] Toda resposta da IA que contém preços é validada contra a tabela de preços real.
- [ ] Se a IA gerar um preço que não corresponde à base de conhecimento, o sistema corrige ou bloqueia a resposta.
- [ ] Respostas fora do escopo da gráfica (ex: "qual a previsão do tempo?") são interceptadas com mensagem padrão.
- [ ] Log/alerta gerado quando uma alucinação é detectada (para monitoramento).
- [ ] Teste funcional: forçar uma resposta com preço incorreto e verificar que o guardrail a bloqueia.
- [ ] Taxa de alucinação de preço: zero em cenários testados.

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Criar arquivo `backend/src/services/guardrails.service.ts`.
- [ ] Implementar método `validateResponse(response: string, retrievedDocs: Document[]): ValidationResult`.
- [ ] Criar lógica de extração de valores monetários da resposta da IA (regex ou parser).
- [ ] Comparar valores extraídos contra os preços presentes nos documentos recuperados.
- [ ] Implementar filtro de escopo: lista de tópicos permitidos (produtos gráficos, preços, prazos, materiais).
- [ ] Criar mensagem padrão para respostas fora do escopo.
- [ ] Integrar o guardrail no pipeline do `RagService` (pós-geração, pré-envio).
- [ ] Testar com cenários adversariais (prompts que tentam forçar alucinação).
- [ ] Adicionar métricas de guardrail nos logs (total de validações, bloqueios, correções).

## 👤 Atribuição
**Responsável:** [A Definir - Dev Backend/IA]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 2 Dias úteis.

## 🏷️ Etiquetas (Labels)
`backend` `ia` `segurança` `validação` `guardrails` `milestone-2`

## 🔗 Anexos ou Referências Técnicas
- [Relatório Milestone 1 - Riscos e Pontos de Atenção](../relatorios/relatorio_milestone1.md)
- [LangChain Output Parsers](https://js.langchain.com/docs/modules/model_io/output_parsers/)

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 13 (RAG Chain implementada), Card 12 (Base de Conhecimento).
- **Bloqueia:** Nenhum (pode ser paralelo ao Card 15-16, mas deve estar pronto antes do deploy).
