# Relatório de Entrega: Card 12

Este documento resume as implementações realizadas para fechar o **Card 12 ([Backend/IA] Alimentar Base de Conhecimento (Vector DB))**. Ele serve como guia para a equipe revisar e testar o script de ingestão e a base de conhecimento inicial do sistema RAG.

---

## 🎯 O que foi entregue (Critérios de Aceite)

- **Catálogo da Gráfica (Mock):** Foi criado o arquivo `backend/data/catalogo.json` contendo uma estrutura rica de categorias, produtos (Cartões de Visita, Panfletos, Banners, Adesivos), tamanhos, cores, quantidades, preços e prazos de entrega.
- **Script de Ingestão:** Implementado o script `backend/src/scripts/seed-knowledge.ts`, responsável por ler o catálogo, transformar em texto estruturado e alimentar o banco de dados.
- **Chunking (Divisão de Texto):** Utilizado o `RecursiveCharacterTextSplitter` do LangChain (`@langchain/textsplitters`) para dividir o catálogo em chunks de 500 caracteres, com sobreposição (overlap) de 50 caracteres, otimizando o contexto para a IA.
- **Geração de Embeddings:** Integração com a OpenAI via `OpenAIEmbeddings` (modelo `text-embedding-3-small`) para gerar os vetores. 
  - *Fallback:* Caso a variável `OPENAI_API_KEY` não seja fornecida, o script utiliza embeddings de mock (1536 dimensões) automaticamente para fins de teste local.
- **Persistência com pgvector:** Os chunks e seus respectivos embeddings (vetores) são salvos na tabela `DocumentosConhecimento` utilizando consultas SQL brutas (`prisma.$executeRaw`) para suportar perfeitamente a extensão nativa `vector` do PostgreSQL.
- **Idempotência:** O script é idempotente. Antes de inserir novos dados, a tabela `DocumentosConhecimento` é limpa, garantindo que o banco de dados não fique com chunks duplicados caso o script seja rodado múltiplas vezes.
- **Busca por Similaridade Vetorial (Teste):** No final do script, há um teste automático executando uma query de busca por similaridade vetorial via SQL (calculando a distância do cosseno com o operador `<=>`) simulando uma pergunta: *"preço de 1000 cartões de visita"*.
- **Comando NPM:** Adicionado o atalho `"seed:knowledge": "ts-node-dev src/scripts/seed-knowledge.ts"` no `package.json` do backend.

---

## 🧪 Como testar e revisar (Comandos para a equipe)

### 1. Preparação (Opcional, mas recomendado)
Se desejar gerar embeddings reais, certifique-se de que o arquivo `backend/.env` possui uma chave da OpenAI:
```env
OPENAI_API_KEY="sk-SuaChaveAqui"
```
*(Se você não tiver uma chave, o script vai avisar no console e usar embeddings "falsos" preenchidos de forma randômica, o que é ótimo para apenas testar o fluxo de inserção).*

### 2. Rodar o script de Ingestão (Seed)
Abra seu terminal, navegue até a pasta `backend` e execute o comando criado:

```bash
cd backend
npm run seed:knowledge
```

### 3. Resultados Esperados no Console
O script irá logar as seguintes etapas:
- O aviso de uso do mock de embeddings (se não houver chave API).
- Quantos "chunks" foram criados.
- A limpeza da tabela (idempotência).
- A inserção de cada chunk.
- **Teste Final:** O log mostrará os resultados (e pontuação de similaridade) para a query de teste *"preço de 1000 cartões de visita"*.

### 4. Verificar no Banco de Dados
Para validar os dados salvos:
- Conecte no PostgreSQL (via DBeaver ou outro client) com as credenciais padrões do projeto.
- Verifique a tabela `DocumentosConhecimento`.
- Você deve ver o conteúdo em formato texto e a coluna `vetor` populada com os arrays numéricos.

---

## 🔍 Para Revisão de Código (Pull Request)
Arquivos principais que a equipe deve revisar nesta entrega:
1. `backend/src/scripts/seed-knowledge.ts` (Lógica de leitura, chunking, embeddings e SQL de inserção vetorial).
2. `backend/data/catalogo.json` (Estrutura dos dados mockados da gráfica).
3. `backend/package.json` (Adição das libs LangChain e script NPM).
