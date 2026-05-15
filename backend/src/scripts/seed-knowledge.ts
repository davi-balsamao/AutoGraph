import { prisma } from '../config/prisma';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Document } from '@langchain/core/documents';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🚀 Iniciando o seeding Otimizado da Base de Conhecimento...');

  const embeddings = new GoogleGenerativeAIEmbeddings({
    modelName: 'gemini-embedding-001',
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const dataDir = path.join(__dirname, '../../data');
  let rawDocuments: Document[] = [];

  // 1. Processar Catálogo (Chunking Estruturado - 1 produto = 1 documento)
  const catalogoPath = path.join(dataDir, 'catalogo.json');
  const catalogo: Array<any> = JSON.parse(fs.readFileSync(catalogoPath, 'utf8'));

  for (const item of catalogo) {
    const textoProduto = `DOCUMENTO: CATÁLOGO DE PRODUTOS\nProduto: ${item.produto}\nDescrição: ${item.descricao}\nRequisitos de orçamento obrigatórios:\n` + item.requisitos_orcamento.map((r: string) => `- ${r}`).join('\n');

    // Produtos não devem ser fatiados. Um produto inteiro é o contexto.
    rawDocuments.push(new Document({ pageContent: textoProduto }));
  }

  // 2. Processar Guias Técnicos (Chunking Semântico)
  const mdFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.md'));
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800, // Aumentado para manter o contexto técnico
    chunkOverlap: 120, // Aumentado para 15% para evitar cortes abruptos
  });

  for (const mdFile of mdFiles) {
    const mdContent = fs.readFileSync(path.join(dataDir, mdFile), 'utf8');
    const chunks = await splitter.createDocuments([mdContent]);

    // Injetar a fonte no início de cada chunk para preservar o contexto no PGVector
    const chunksComFonte = chunks.map(chunk => new Document({
      pageContent: `FONTE: ${mdFile}\n\n${chunk.pageContent}`
    }));

    rawDocuments.push(...chunksComFonte);
  }

  console.log(`📚 Total de ${rawDocuments.length} chunks gerados. Gerando embeddings em lote...`);

  // Limpar tabela
  await prisma.$executeRaw`DELETE FROM "DocumentosConhecimento"`;

  // 3. Gerar Embeddings em Lote (Evita Rate Limits e é 10x mais rápido)
  const textos = rawDocuments.map(doc => doc.pageContent);
  const vetores = await embeddings.embedDocuments(textos);

  // 4. Inserção no Banco
  for (let i = 0; i < rawDocuments.length; i++) {
    const vectorString = `[${vetores[i].join(',')}]`;

    await prisma.$executeRaw`
      INSERT INTO "DocumentosConhecimento" (id, conteudo, vetor)
      VALUES (gen_random_uuid(), ${rawDocuments[i].pageContent}, ${vectorString}::vector)
    `;
  }

  console.log('✅ Base de Conhecimento alimentada com sucesso!');
}

main().catch(console.error).finally(() => prisma.$disconnect());