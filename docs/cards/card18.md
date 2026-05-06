# [Backend/IA] Guardrails e Validação de Preços

## 📖 Descrição
Um dos riscos críticos de usar IA generativa em contexto comercial é a alucinação de preços. Com as novas regras de negócio, a IA **nunca** deve fornecer preços, pois os orçamentos dependem de aprovação da recepcionista. Esta tarefa implementa uma camada de validação (guardrails) que bloqueia **QUALQUER** resposta da IA que contenha valores monetários, garantindo que o cliente não receba orçamentos falsos. Também define limites de escopo para que a IA não responda perguntas fora do contexto da gráfica.

## ✅ Critérios de Aceite (Definition of Done)
- [x] Serviço de validação criado em `backend/src/services/guardrails.service.ts`.
- [x] Qualquer resposta da IA que contenha cifras ou valores monetários (ex: R$, $) é interceptada.
- [x] Se a IA gerar um preço, o sistema substitui a resposta por: "Vou repassar seus dados para a nossa recepcionista gerar o orçamento."
- [x] Respostas fora do escopo da gráfica (ex: "qual a previsão do tempo?") são interceptadas com mensagem padrão.
- [x] Log/alerta gerado quando uma violação é detectada.
- [x] Teste funcional: forçar uma resposta com preço e verificar que o guardrail a bloqueia.
- [x] Taxa de orçamentos dados pela IA: zero em todos os cenários testados.

## 🛠️ Checklist de Tarefas Técnicas
- [x] Criar arquivo `backend/src/services/guardrails.service.ts`.
- [x] Implementar método `validateResponse(response: string): ValidationResult`.
- [x] Criar lógica de extração de valores monetários da resposta da IA (regex ou parser).
- [x] Se valores monetários forem detectados, marcar como inválido (sem comparar com a base).
- [x] Implementar filtro de escopo: lista de tópicos permitidos (produtos gráficos, preços, prazos, materiais).
- [x] Criar mensagem padrão para respostas fora do escopo.
- [x] Integrar o guardrail no pipeline do `RagService` (pós-geração, pré-envio).
- [x] Testar com cenários adversariais (prompts que tentam forçar alucinação).
- [x] Adicionar métricas de guardrail nos logs (total de validações, bloqueios, correções).

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
