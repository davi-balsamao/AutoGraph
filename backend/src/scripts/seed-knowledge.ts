import { prisma } from '../config/prisma';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Document } from '@langchain/core/documents';
import * as fs from 'fs';
import * as path from 'path';
import { nextEmbeddingApiKey } from '../services/llm-factory';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🚀 Iniciando o seeding Otimizado da Base de Conhecimento...');

  // Check if we already have knowledge documents to avoid slow API embedding calls
  const countResult = await prisma.$queryRaw<Array<{ count: string | number | bigint }>>`SELECT COUNT(*) as count FROM "DocumentosConhecimento"`;
  const docCount = Number(countResult[0]?.count || 0);
  if (docCount > 0) {
    console.log(`✅ Base de Conhecimento já possui ${docCount} documentos antigos. Eles serão recriados.`);
  }

  const embeddings = new GoogleGenerativeAIEmbeddings({
    modelName: 'gemini-embedding-001',
    apiKey: nextEmbeddingApiKey(),
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

  // 3. Gerar Embeddings em Lote (Evita Rate Limits e falhas silenciosas de payload)
  const textos = rawDocuments.map(doc => doc.pageContent);
  const vetores: number[][] = [];
  
  const BATCH_SIZE = 30;      // Aumentado de 3 para 30 para reduzir número de chamadas de API e acelerar o seed
  const DELAY_MS = 5000;     // 5s entre lotes
  const MAX_RETRIES = 3;     // Tentativas por lote

  const totalBatches = Math.ceil(textos.length / BATCH_SIZE);

  for (let i = 0; i < textos.length; i += BATCH_SIZE) {
    const batch = textos.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`⏳ Gerando vetores para lote ${batchNum}/${totalBatches} (${batch.length} docs)...`);

    let success = false;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const batchVetores = await embeddings.embedDocuments(batch);

        // Verificar se todos os vetores são válidos (não vazios)
        const allValid = batchVetores.every(v => v && v.length > 0);
        if (!allValid) {
          throw new Error('API retornou vetores vazios — possível rate-limit silencioso');
        }

        vetores.push(...batchVetores);
        success = true;
        break;
      } catch (err: any) {
        console.warn(`⚠️ Tentativa ${attempt}/${MAX_RETRIES} falhou para lote ${batchNum}: ${err.message || err}`);
        if (attempt < MAX_RETRIES) {
          const backoff = DELAY_MS * attempt; // Backoff exponencial: 5s, 10s, 15s
          console.log(`   ⏳ Aguardando ${backoff / 1000}s antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }

    if (!success) {
      console.error(`❌ Lote ${batchNum} falhou após ${MAX_RETRIES} tentativas. Preenchendo com vetores vazios.`);
      vetores.push(...batch.map(() => []));
    }

    // Delay entre lotes para respeitar rate-limit
    if (i + BATCH_SIZE < textos.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  // 4. Inserção no Banco
  for (let i = 0; i < rawDocuments.length; i++) {
    if (!vetores[i] || vetores[i].length === 0) {
      console.warn(`⚠️ Vetor vazio retornado para o documento: ${rawDocuments[i].pageContent.substring(0, 50)}... Pulando.`);
      continue;
    }
    const vectorString = `[${vetores[i].join(',')}]`;

    await prisma.$executeRaw`
      INSERT INTO "DocumentosConhecimento" (id, conteudo, vetor)
      VALUES (gen_random_uuid(), ${rawDocuments[i].pageContent}, ${vectorString}::vector)
    `;
  }

  console.log('✅ Base de Conhecimento alimentada com sucesso!');
}

main().catch(console.error).finally(() => prisma.$disconnect());