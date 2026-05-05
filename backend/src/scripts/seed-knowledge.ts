import { prisma } from '../config/prisma';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings } from '@langchain/openai';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Iniciando o seeding da Base de Conhecimento (Vector DB)...');

  const useMockEmbeddings = !process.env.OPENAI_API_KEY;
  if (useMockEmbeddings) {
    console.warn('AVISO: OPENAI_API_KEY não definida. Usando embeddings MOCK para testes (1536 dimensões).');
  }

  // Instanciar o gerador de embeddings se tiver chave
  const embeddings = useMockEmbeddings ? null : new OpenAIEmbeddings({
    modelName: 'text-embedding-3-small',
  });

  // Ler o mock do catálogo
  const catalogoPath = path.join(__dirname, '../../data/catalogo.json');
  if (!fs.existsSync(catalogoPath)) {
    console.error(`ERRO: Arquivo de catálogo não encontrado em ${catalogoPath}`);
    process.exit(1);
  }

  const catalogoRaw = fs.readFileSync(catalogoPath, 'utf8');
  const catalogo: Array<any> = JSON.parse(catalogoRaw);

  // Transformar JSON em texto para chunking
  let textoParaChunking = '';
  
  for (const categoria of catalogo) {
    textoParaChunking += `## Categoria: ${categoria.categoria}\n\n`;
    for (const item of categoria.itens) {
      textoParaChunking += `Produto: ${item.produto}\n`;
      if (item.tamanho) textoParaChunking += `Tamanho: ${item.tamanho}\n`;
      if (item.cores) textoParaChunking += `Cores: ${item.cores}\n`;
      if (item.corte) textoParaChunking += `Corte: ${item.corte}\n`;
      if (item.acabamento) textoParaChunking += `Acabamento: ${item.acabamento}\n`;
      textoParaChunking += `Quantidade: ${item.quantidade}\n`;
      textoParaChunking += `Preço: R$ ${item.preco.toFixed(2)}\n`;
      textoParaChunking += `Prazo de Entrega: ${item.prazo_entrega}\n`;
      textoParaChunking += `Descrição: ${item.descricao}\n\n`;
    }
  }

  // Dividir o texto em chunks (pedaços menores)
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const docs = await splitter.createDocuments([textoParaChunking]);
  console.log(`Documento dividido em ${docs.length} chunks.`);

  // Limpar dados existentes para idempotência
  console.log('Limpando tabela "DocumentosConhecimento" (Idempotência)...');
  await prisma.$executeRaw`DELETE FROM "DocumentosConhecimento"`;

  // Processar e salvar cada chunk com seu embedding
  for (let i = 0; i < docs.length; i++) {
    const conteudoChunk = docs[i].pageContent;
    
    // Gerar o vetor usando a API da OpenAI ou Mock
    let vector: number[];
    if (embeddings) {
      vector = await embeddings.embedQuery(conteudoChunk);
    } else {
      vector = Array(1536).fill(0).map(() => Math.random() * 2 - 1);
    }

    // Transformar o array de floats em uma string formatada para o PostgreSQL: '[0.1, 0.2, ...]'
    const vectorString = `[${vector.join(',')}]`;

    // Inserir usando SQL bruto porque Prisma usa tipo Unsupported para extensões nativas no pg
    await prisma.$executeRaw`
      INSERT INTO "DocumentosConhecimento" (id, conteudo, vetor)
      VALUES (gen_random_uuid(), ${conteudoChunk}, ${vectorString}::vector)
    `;

    console.log(`Chunk ${i + 1}/${docs.length} inserido com sucesso.`);
  }

  console.log('Base de Conhecimento alimentada com sucesso!');

  // Teste opcional: busca de similaridade (Query: 'preço de 1000 cartões de visita')
  const testQuery = 'preço de 1000 cartões de visita';
  console.log(`\nTestando busca vetorial para a query: "${testQuery}"...`);
  
  let queryVector: number[];
  if (embeddings) {
    queryVector = await embeddings.embedQuery(testQuery);
  } else {
    queryVector = Array(1536).fill(0).map(() => Math.random() * 2 - 1);
  }

  const queryVectorString = `[${queryVector.join(',')}]`;

  // <=> calcula a cosine distance
  const resultados: any[] = await prisma.$queryRaw`
    SELECT id, conteudo, 1 - (vetor <=> ${queryVectorString}::vector) as similaridade
    FROM "DocumentosConhecimento"
    ORDER BY vetor <=> ${queryVectorString}::vector
    LIMIT 2
  `;

  console.log('Resultados da busca:');
  resultados.forEach(res => {
    console.log(`- [Score: ${res.similaridade.toFixed(4)}] ${res.conteudo.substring(0, 100).replace(/\n/g, ' ')}...`);
  });
}

main()
  .catch((e) => {
    console.error('Erro na execução do seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
