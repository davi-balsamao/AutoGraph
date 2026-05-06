# 📝 Relatório de Entrega — Card 13: Implementar RAG Chain

---

## 1. O que foi entregue

### Critérios de Aceite Atendidos

| # | Critério (DoD) | Status |
|---|---|---|
| 1 | Arquivo criado em `backend/src/services/rag.service.ts` | ✅ |
| 2 | Implementada a `RunnableSequence` unindo Retriever → Prompt → LLM | ✅ |
| 3 | Logs ativos mostrando query, documentos recuperados e prompt final | ✅ |
| 4 | Fallback funcionando para perguntas fora de escopo | ✅ |
| 5 | Resposta sem invenções para o teste de preço de "cartões de visita" | ✅ |
| 6 | Método `query(question: string)` que executa o pipeline RAG completo | ✅ |
| 7 | Retriever busca os top-K documentos mais similares via pgvector | ✅ |
| 8 | Prompt template com instrução de responder APENAS com base nos docs | ✅ |
| 9 | Respostas não contêm alucinações (regras codificadas no prompt) | ✅ |

### Diretrizes de Segurança Implementadas

| Diretriz | Implementação |
|---|---|
| **Temperature 0.0** | `ChatOpenAI({ temperature: 0.0 })` — LLM determinístico |
| **No Math Policy** | Proibição de cálculos codificada no system prompt |
| **Unidade de Medida** | Proibição de conversão de unidades no system prompt |
| **Prompt Injection Guard** | Pergunta isolada como variável `{question}` separada das instruções do sistema |
| **Context Transparency** | Método `query()` retorna `sourceDocuments` (IDs + scores) para auditoria |
| **Threshold de Similaridade** | `minScore: 0.75` — documentos abaixo são descartados |
| **Fallback Determinístico** | "Não tenho essa informação no momento." quando contexto é insuficiente |

---

## 2. Como testar e revisar

### Pré-requisitos

1. **PostgreSQL com pgvector** rodando (via Docker ou local)
2. **Base de conhecimento alimentada** (Card 12):
   ```bash
   npm run seed:knowledge
   ```
3. **OPENAI_API_KEY** configurada no `.env`:
   ```bash
   # Adicionar ao arquivo backend/.env
   OPENAI_API_KEY=sk-sua-chave-aqui
   OPENAI_MODEL=gpt-4o    # opcional, padrão: gpt-4o
   ```

### Executar a Bateria de Testes

```bash
cd backend
npm run test:rag
```

### O que o script de teste valida

| Teste | Pergunta | Resultado Esperado |
|---|---|---|
| 📦 Recuperação | "Quais são as opções com verniz localizado?" | Retorna documento sobre acabamentos com verniz |
| 🚫 Negação | "Vocês fazem impressão em camisetas?" | Fallback: "Não tenho essa informação no momento." |
| 🛡️ Segurança | Tentativa de forçar desconto via prompt injection | Ignora comando malicioso, mantém tabela oficial |
| 🎯 Precisão | "Qual o preço de 1000 cartões de visita em papel couchê?" | Preço correto: R$ 65,00 ou R$ 120,00 (conforme catálogo) |
| 📋 Prazo | "Qual o prazo de entrega de um banner?" | "2 dias úteis" (transcrição literal) |

### Verificação Manual de Logs

Durante a execução do `test:rag`, o console exibirá:

```
========== RAG QUERY ==========
📝 Pergunta: "..."
🔢 Embedding gerado (dimensões: 1536)
📚 Documentos recuperados: N (threshold >= 0.75)
   📄 [1] ID: uuid-xxx | Score: 0.8723
       Conteúdo: Produto: Cartão de Visita Couchê 250g...
📤 Prompt final montado. Enviando para o LLM...
💬 Resposta: "..."
================================
```

---

## 3. Arquivos principais

| Arquivo | Descrição |
|---|---|
| [rag.service.ts](file:///home/jose/Área%20de%20trabalho/Desafio%20de%20Ciclo/AutoGraph/backend/src/services/rag.service.ts) | Serviço RAG completo — pipeline Retriever → Prompt → LLM |
| [rag-template.ts](file:///home/jose/Área%20de%20trabalho/Desafio%20de%20Ciclo/AutoGraph/backend/src/services/rag-template.ts) | System prompt com persona, regras anti-alucinação e No Math Policy |
| [test-rag.ts](file:///home/jose/Área%20de%20trabalho/Desafio%20de%20Ciclo/AutoGraph/backend/src/scripts/test-rag.ts) | Bateria de 5 testes funcionais (recuperação, negação, segurança, precisão, logs) |
| [package.json](file:///home/jose/Área%20de%20trabalho/Desafio%20de%20Ciclo/AutoGraph/backend/package.json) | Adicionado script `test:rag` |
| [.env.example](file:///home/jose/Área%20de%20trabalho/Desafio%20de%20Ciclo/AutoGraph/backend/.env.example) | Adicionadas variáveis `OPENAI_API_KEY` e `OPENAI_MODEL` |

---

## 🔗 Dependências

- **Bloqueado por:** Card 11 (Setup LangChain ✅), Card 12 (Base de Conhecimento ✅)
- **Bloqueia:** Card 14 (Integração de Mensagens), Card 18 (Guardrails de Preços)
