# Relatório de Adequação — Novas Regras de Negócio (Triagem)

Este relatório documenta as alterações feitas no código e no planejamento da Milestone 2 para acomodar o fluxo de atendimento da gráfica: **A IA faz a triagem do pedido e a recepcionista fornece o preço.**

---

## 1. O que foi feito no Código (Backend)

### Catálogo e Base de Conhecimento (`catalogo.json` e `seed-knowledge.ts`)
- O arquivo `backend/data/catalogo.json` foi completamente reescrito. Em vez de preços, tamanhos fixos e prazos, ele agora contém **Perguntas Obrigatórias** para cada produto.
- O script `seed-knowledge.ts` foi atualizado para ler esses requisitos e transformar em texto instrucional para a IA (ex: *"Para orçar Panfletos, o assistente DEVE perguntar: Você tem arte pronta? Qual a quantidade?..."*).

### RAG Template (`rag-template.ts`)
- O `System Prompt` da IA foi alterado radicalmente.
- **Antes:** "Responda os preços com base na tabela."
- **Agora:** "Você é o Assistente de Triagem. Identifique o produto e faça as perguntas necessárias. **PROIBIÇÃO ABSOLUTA DE FORNECER PREÇOS.** Ao terminar de coletar, diga que a recepcionista irá gerar o orçamento."

### Guardrails (`guardrails.service.ts`)
- A regra de validação de preços foi endurecida. 
- **Antes:** "Verifique se o preço falado pela IA existe no documento."
- **Agora:** "Se a IA tentar falar **qualquer valor monetário** (cifras, R$, etc), bloqueie a resposta imediatamente e substitua por uma mensagem avisando que a recepcionista assumirá o orçamento."

---

## 2. O que foi feito no Planejamento (Cards)

Os arquivos `.md` na pasta `docs/cards/` foram reescritos para alinhar a equipe de desenvolvimento com a nova realidade:

- **Card 12:** Atualizado para focar em ingestão de "Roteiros de Perguntas" e não de preços.
- **Card 13:** O RAG Chain agora é oficialmente definido como um "Cérebro de Triagem e Entrevista".
- **Card 15 (Mais Importante):** A Extração de Entidades agora não busca variáveis fixas, mas sim variáveis dinâmicas dependendo das respostas do cliente aos requisitos do catálogo.
- **Card 16:** A OS gerada pela IA não nasce com status `CRIADA` indo pra produção. Nasce como `AGUARDANDO_ORCAMENTO` e dispara uma notificação (transbordo) para a recepcionista.
- **Card 18:** Critérios atualizados para forçar tolerância ZERO a saídas financeiras do LLM.

---

## 3. Manual: Como adicionar um Novo Produto no Futuro?

Quando a gráfica passar a vender um serviço novo (exemplo: **Canecas Personalizadas**), o processo para atualizar a IA será extremamente simples. Não será necessário mexer em código!

Siga este passo a passo:

### Passo 1: Atualizar o arquivo JSON
Abra o arquivo `backend/data/catalogo.json` e adicione o novo produto na lista, especificando **quais perguntas** a IA precisa fazer para aquele produto. Exemplo:

```json
{
  "produto": "Canecas Personalizadas",
  "descricao": "Canecas de cerâmica com estampa em sublimação.",
  "requisitos_orcamento": [
    "Você já tem a arte ou foto que vai na caneca?",
    "A caneca será branca padrão ou com interior colorido?",
    "Quantas unidades você precisa?"
  ]
}
```

### Passo 2: Rodar o Script de Ingestão (Seed)
Acesse a pasta do backend via terminal e rode o comando:
```bash
npm run seed:knowledge
```

**O que vai acontecer por baixo dos panos?**
1. O script vai limpar a base de conhecimento antiga.
2. Vai ler o arquivo JSON atualizado.
3. Vai gerar os novos "embeddings" (vetores) na OpenAI e salvar no banco PostgreSQL (`pgvector`).
4. A partir desse momento, quando um cliente falar no WhatsApp: *"Quero fazer uma caneca"*, o RAG buscará no banco, encontrará esse bloco novo, e a IA magicamente começará a fazer as 3 perguntas listadas acima, uma a uma.

### Passo 3 (Opcional): Ajustar o App da Recepcionista
Como o "Card 15" extrairá os dados e o "Card 16" criará a OS, a recepcionista já receberá no aplicativo a notificação: 
> **Novo Pedido - Canecas Personalizadas**
> - Arte: Não tem
> - Tipo: Interior Colorido
> - Quantidade: 5

Ela só precisará ler os dados, digitar o preço no App e fechar a OS. A inteligência do fluxo se adapta sozinha aos dados do JSON.
