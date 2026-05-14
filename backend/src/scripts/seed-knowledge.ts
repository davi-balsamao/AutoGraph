/**
 * seed-knowledge.ts
 *
 * Alimenta a Base de Conhecimento (Vector DB) com chunking específico por tipo
 * de documento, garantindo que cada chunk seja coeso e semanticamente completo.
 *
 * Estratégias usadas:
 *  - catalogo.json + catalogo_produtos.json → 1 chunk atômico por produto (merged)
 *  - perguntas.md → 1 chunk por item numerado (par Q&A completo)
 *  - demais .md    → RecursiveCharacterTextSplitter (chunkSize 700, overlap 100)
 */

import { prisma } from '../config/prisma';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChunkPayload {
  conteudo: string;
  source: string;
  doc_type: 'produto' | 'faq' | 'tecnico' | 'regra';
  chunk_index: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalise a product key so we can match between the two JSON catalogs.
 * "Banner ou Lona" → "banner_lona", "Cartão de Visita" → "cartao_visita"
 */
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Render the merged product chunk as readable plain text for the LLM.
 */
function renderProductChunk(
  produto: string,
  descricao: string,
  requisitosOrcamento: string[],
  papeisPermitidos: string[],
  acabamentosPermitidos: string[],
  entidadesObrigatorias: string[],
): string {
  const lines: string[] = [
    `## Produto: ${produto}`,
    `Descrição: ${descricao}`,
    '',
    'Para orçar este produto, o assistente DEVE perguntar ao cliente:',
    ...requisitosOrcamento.map((r) => `- ${r}`),
  ];

  if (papeisPermitidos.length > 0) {
    lines.push('', `Papéis permitidos: ${papeisPermitidos.join(', ')}`);
  }
  if (acabamentosPermitidos.length > 0) {
    lines.push(`Acabamentos disponíveis: ${acabamentosPermitidos.join(', ')}`);
  }
  if (entidadesObrigatorias.length > 0) {
    lines.push(
      `Informações obrigatórias para abertura da OS: ${entidadesObrigatorias.join(', ')}`,
    );
  }

  return lines.join('\n');
}

// ─── Chunking strategies ──────────────────────────────────────────────────────

/**
 * Strategy A: Merge catalogo.json + catalogo_produtos.json → 1 atomic chunk per product.
 */
function buildProductChunks(dataDir: string): ChunkPayload[] {
  const catalogoPath = path.join(dataDir, 'catalogo.json');
  const produtosPath = path.join(dataDir, 'catalogo_produtos.json');

  if (!fs.existsSync(catalogoPath)) {
    throw new Error(`ERRO: catalogo.json não encontrado em ${catalogoPath}`);
  }

  const catalogo: Array<{ produto: string; descricao: string; requisitos_orcamento: string[] }> =
    JSON.parse(fs.readFileSync(catalogoPath, 'utf8'));

  // catalogo_produtos.json is optional (graceful if missing)
  const produtos: Record<
    string,
    {
      papeis_permitidos: string[];
      acabamentos_permitidos: string[];
      entidades_obrigatorias: string[];
    }
  > = fs.existsSync(produtosPath) ? JSON.parse(fs.readFileSync(produtosPath, 'utf8')) : {};

  return catalogo.map((item, i) => {
    const slug = toSlug(item.produto);
    const constraints = produtos[slug] ?? {
      papeis_permitidos: [],
      acabamentos_permitidos: [],
      entidades_obrigatorias: [],
    };

    return {
      conteudo: renderProductChunk(
        item.produto,
        item.descricao,
        item.requisitos_orcamento,
        constraints.papeis_permitidos,
        constraints.acabamentos_permitidos,
        constraints.entidades_obrigatorias,
      ),
      source: 'catalogo.json+catalogo_produtos.json',
      doc_type: 'produto',
      chunk_index: i,
    };
  });
}

/**
 * Strategy B: perguntas.md → split on numbered item boundaries (1. 2. 3. …).
 */
function buildFaqChunks(content: string, filename: string): ChunkPayload[] {
  // Split on lines that start with a digit followed by a period (e.g. "1. ", "2. ")
  const rawItems = content.split(/(?=^\d+\.\s)/m).filter((s) => s.trim().length > 0);

  return rawItems.map((item, i) => ({
    conteudo: item.trim(),
    source: filename,
    doc_type: 'faq',
    chunk_index: i,
  }));
}

/**
 * Strategy C: Generic markdown → RecursiveCharacterTextSplitter.
 * chunkSize 700 / overlap 100 (~14%) respects section/paragraph boundaries.
 */
async function buildMarkdownChunks(
  content: string,
  filename: string,
  docType: ChunkPayload['doc_type'],
): Promise<ChunkPayload[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 700,
    chunkOverlap: 100,
    separators: ['\n## ', '\n### ', '\n\n', '\n', '. ', ' ', ''],
  });

  const docs = await splitter.createDocuments([content]);

  return docs.map((doc, i) => ({
    conteudo: doc.pageContent,
    source: filename,
    doc_type: docType,
    chunk_index: i,
  }));
}

/** Classify a .md filename into a doc_type for Strategy C. */
function classifyMd(filename: string): ChunkPayload['doc_type'] {
  const name = filename.toLowerCase();
  if (name.includes('regra') || name.includes('chatbot') || name.includes('atendimento')) {
    return 'regra';
  }
  if (name.includes('catalogo') || name.includes('guia') || name.includes('apresentacao')) {
    return 'tecnico';
  }
  return 'tecnico'; // safe default
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n========== SEEDING BASE DE CONHECIMENTO ==========');

  const useMockEmbeddings = !process.env.GOOGLE_API_KEY;
  if (useMockEmbeddings) {
    console.warn(
      'AVISO: GOOGLE_API_KEY não definida. Usando embeddings MOCK para testes (768 dimensões).',
    );
  }

  const embeddings = useMockEmbeddings
    ? null
    : new GoogleGenerativeAIEmbeddings({
        modelName: 'gemini-embedding-001',
        apiKey: process.env.GOOGLE_API_KEY,
      });

  const dataDir = path.join(__dirname, '../../data');
  const chunks: ChunkPayload[] = [];

  // ── A. Product catalog (merged) ──────────────────────────────────────────
  console.log('\n📦 Processando catálogo de produtos (merged)...');
  const productChunks = buildProductChunks(dataDir);
  chunks.push(...productChunks);
  console.log(`   → ${productChunks.length} chunks de produto gerados.`);

  // ── B. Markdown files ────────────────────────────────────────────────────
  const files = fs.readdirSync(dataDir);
  const mdFiles = files.filter((f) => f.endsWith('.md'));

  for (const mdFile of mdFiles) {
    console.log(`\n📄 Processando: ${mdFile}`);
    const content = fs.readFileSync(path.join(dataDir, mdFile), 'utf8');

    let fileChunks: ChunkPayload[];

    if (mdFile === 'perguntas.md') {
      // Strategy B — Q&A pairs
      fileChunks = buildFaqChunks(content, mdFile);
      console.log(`   → Estratégia FAQ: ${fileChunks.length} pares Q&A.`);
    } else {
      // Strategy C — Semantic markdown
      const docType = classifyMd(mdFile);
      fileChunks = await buildMarkdownChunks(content, mdFile, docType);
      console.log(
        `   → Estratégia Semântica [${docType}]: ${fileChunks.length} chunks.`,
      );
    }

    chunks.push(...fileChunks);
  }

  console.log(`\n📊 Total: ${chunks.length} chunks a indexar.`);

  // ── Clear existing knowledge base (idempotent) ───────────────────────────
  console.log('\n🗑️  Limpando tabela "DocumentosConhecimento"...');
  await prisma.$executeRaw`DELETE FROM "DocumentosConhecimento"`;

  // ── Embed and insert ─────────────────────────────────────────────────────
  console.log('\n🔄 Gerando embeddings e inserindo chunks...\n');

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    let vector: number[];
    if (embeddings) {
      vector = await embeddings.embedQuery(chunk.conteudo);
    } else {
      vector = Array(768)
        .fill(0)
        .map(() => Math.random() * 2 - 1);
    }

    const vectorString = `[${vector.join(',')}]`;

    await prisma.$executeRaw`
      INSERT INTO "DocumentosConhecimento" (id, conteudo, vetor, source, doc_type, chunk_index)
      VALUES (
        gen_random_uuid(),
        ${chunk.conteudo},
        ${vectorString}::vector,
        ${chunk.source},
        ${chunk.doc_type},
        ${chunk.chunk_index}
      )
    `;

    const label = `[${chunk.doc_type.toUpperCase().padEnd(7)} | ${chunk.source}]`;
    process.stdout.write(`\r   Chunk ${i + 1}/${chunks.length} ${label}  `);
  }

  console.log('\n\n✅ Base de Conhecimento alimentada com sucesso!');

  // ── Smoke test ────────────────────────────────────────────────────────────
  const testQuery = 'quero fazer um cartão de visita';
  console.log(`\n🔍 Smoke test: "${testQuery}"`);

  let queryVector: number[];
  if (embeddings) {
    queryVector = await embeddings.embedQuery(testQuery);
  } else {
    queryVector = Array(768)
      .fill(0)
      .map(() => Math.random() * 2 - 1);
  }

  const queryVectorString = `[${queryVector.join(',')}]`;

  const resultados: any[] = await prisma.$queryRaw`
    SELECT id, conteudo, source, doc_type,
           1 - (vetor <=> ${queryVectorString}::vector) as similaridade
    FROM "DocumentosConhecimento"
    WHERE vetor IS NOT NULL
    ORDER BY vetor <=> ${queryVectorString}::vector
    LIMIT 3
  `;

  console.log('Resultados:');
  resultados.forEach((res) => {
    console.log(
      `  [Score: ${Number(res.similaridade).toFixed(4)}] [${res.doc_type}] ${res.source} — "${res.conteudo.substring(0, 80).replace(/\n/g, ' ')}..."`,
    );
  });
}

main()
  .catch((e) => {
    console.error('\n❌ Erro na execução do seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
