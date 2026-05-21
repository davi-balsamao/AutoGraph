"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../config/prisma");
const textsplitters_1 = require("@langchain/textsplitters");
const google_genai_1 = require("@langchain/google-genai");
const documents_1 = require("@langchain/core/documents");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const llm_factory_1 = require("../services/llm-factory");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function main() {
    console.log('🚀 Iniciando o seeding Otimizado da Base de Conhecimento...');
    // Check if we already have knowledge documents to avoid slow API embedding calls
    const countResult = await prisma_1.prisma.$queryRaw `SELECT COUNT(*) as count FROM "DocumentosConhecimento"`;
    const docCount = Number(countResult[0]?.count || 0);
    if (docCount > 0) {
        console.log(`✅ Base de Conhecimento já possui ${docCount} documentos antigos. Eles serão recriados.`);
    }
    const embeddings = new google_genai_1.GoogleGenerativeAIEmbeddings({
        modelName: 'gemini-embedding-001',
        apiKey: (0, llm_factory_1.nextEmbeddingApiKey)(),
    });
    const dataDir = path.join(__dirname, '../../data');
    let rawDocuments = [];
    // 1. Processar Catálogo (Chunking Estruturado - 1 produto = 1 documento)
    const catalogoPath = path.join(dataDir, 'catalogo.json');
    const catalogo = JSON.parse(fs.readFileSync(catalogoPath, 'utf8'));
    for (const item of catalogo) {
        const textoProduto = `DOCUMENTO: CATÁLOGO DE PRODUTOS\nProduto: ${item.produto}\nDescrição: ${item.descricao}\nRequisitos de orçamento obrigatórios:\n` + item.requisitos_orcamento.map((r) => `- ${r}`).join('\n');
        // Produtos não devem ser fatiados. Um produto inteiro é o contexto.
        rawDocuments.push(new documents_1.Document({ pageContent: textoProduto }));
    }
    // 2. Processar Guias Técnicos (Chunking Semântico)
    const mdFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.md'));
    const splitter = new textsplitters_1.RecursiveCharacterTextSplitter({
        chunkSize: 800, // Aumentado para manter o contexto técnico
        chunkOverlap: 120, // Aumentado para 15% para evitar cortes abruptos
    });
    for (const mdFile of mdFiles) {
        const mdContent = fs.readFileSync(path.join(dataDir, mdFile), 'utf8');
        const chunks = await splitter.createDocuments([mdContent]);
        // Injetar a fonte no início de cada chunk para preservar o contexto no PGVector
        const chunksComFonte = chunks.map(chunk => new documents_1.Document({
            pageContent: `FONTE: ${mdFile}\n\n${chunk.pageContent}`
        }));
        rawDocuments.push(...chunksComFonte);
    }
    console.log(`📚 Total de ${rawDocuments.length} chunks gerados. Gerando embeddings em lote...`);
    // Limpar tabela
    await prisma_1.prisma.$executeRaw `DELETE FROM "DocumentosConhecimento"`;
    // 3. Gerar Embeddings em Lote (Evita Rate Limits e falhas silenciosas de payload)
    const textos = rawDocuments.map(doc => doc.pageContent);
    const vetores = [];
    const BATCH_SIZE = 30; // Aumentado de 3 para 30 para reduzir número de chamadas de API e acelerar o seed
    const DELAY_MS = 5000; // 5s entre lotes
    const MAX_RETRIES = 3; // Tentativas por lote
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
            }
            catch (err) {
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
        await prisma_1.prisma.$executeRaw `
      INSERT INTO "DocumentosConhecimento" (id, conteudo, vetor)
      VALUES (gen_random_uuid(), ${rawDocuments[i].pageContent}, ${vectorString}::vector)
    `;
    }
    console.log('✅ Base de Conhecimento alimentada com sucesso!');
}
main().catch(console.error).finally(() => prisma_1.prisma.$disconnect());
