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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function main() {
    console.log('Iniciando o seeding da Base de Conhecimento (Vector DB)...');
    const useMockEmbeddings = !process.env.GOOGLE_API_KEY;
    if (useMockEmbeddings) {
        console.warn('AVISO: GOOGLE_API_KEY não definida. Usando embeddings MOCK para testes (768 dimensões).');
    }
    // Instanciar o gerador de embeddings se tiver chave
    const embeddings = useMockEmbeddings ? null : new google_genai_1.GoogleGenerativeAIEmbeddings({
        modelName: 'gemini-embedding-001',
        apiKey: process.env.GOOGLE_API_KEY,
    });
    // Ler o mock do catálogo
    const dataDir = path.join(__dirname, '../../data');
    const catalogoPath = path.join(dataDir, 'catalogo.json');
    if (!fs.existsSync(catalogoPath)) {
        console.error(`ERRO: Arquivo de catálogo não encontrado em ${catalogoPath}`);
        process.exit(1);
    }
    const catalogoRaw = fs.readFileSync(catalogoPath, 'utf8');
    const catalogo = JSON.parse(catalogoRaw);
    // Transformar JSON em texto para chunking
    let textoParaChunking = '';
    for (const item of catalogo) {
        textoParaChunking += `## Produto: ${item.produto}\n`;
        textoParaChunking += `Descrição: ${item.descricao}\n`;
        textoParaChunking += `Para fazer o orçamento de ${item.produto}, o assistente DEVE perguntar ao cliente as seguintes informações:\n`;
        for (const req of item.requisitos_orcamento) {
            textoParaChunking += `- ${req}\n`;
        }
        textoParaChunking += `\n`;
    }
    // Ler dinamicamente todos os arquivos .md (Guias técnicos, regras, etc.)
    const files = fs.readdirSync(dataDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    for (const mdFile of mdFiles) {
        console.log(`Lendo arquivo de contexto adicional: ${mdFile}`);
        const mdPath = path.join(dataDir, mdFile);
        const mdContent = fs.readFileSync(mdPath, 'utf8');
        textoParaChunking += `\n\n--- INÍCIO DO ARQUIVO: ${mdFile} ---\n`;
        textoParaChunking += mdContent;
        textoParaChunking += `\n--- FIM DO ARQUIVO: ${mdFile} ---\n`;
    }
    // Dividir o texto em chunks (pedaços menores)
    const splitter = new textsplitters_1.RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 50,
    });
    const docs = await splitter.createDocuments([textoParaChunking]);
    console.log(`Documento dividido em ${docs.length} chunks.`);
    // Limpar dados existentes para idempotência
    console.log('Limpando tabela "DocumentosConhecimento" (Idempotência)...');
    await prisma_1.prisma.$executeRaw `DELETE FROM "DocumentosConhecimento"`;
    // Processar e salvar cada chunk com seu embedding
    for (let i = 0; i < docs.length; i++) {
        const conteudoChunk = docs[i].pageContent;
        // Gerar o vetor usando a API da OpenAI ou Mock
        let vector;
        if (embeddings) {
            vector = await embeddings.embedQuery(conteudoChunk);
        }
        else {
            vector = Array(768).fill(0).map(() => Math.random() * 2 - 1);
        }
        // Transformar o array de floats em uma string formatada para o PostgreSQL: '[0.1, 0.2, ...]'
        const vectorString = `[${vector.join(',')}]`;
        // Inserir usando SQL bruto porque Prisma usa tipo Unsupported para extensões nativas no pg
        await prisma_1.prisma.$executeRaw `
      INSERT INTO "DocumentosConhecimento" (id, conteudo, vetor)
      VALUES (gen_random_uuid(), ${conteudoChunk}, ${vectorString}::vector)
    `;
        console.log(`Chunk ${i + 1}/${docs.length} inserido com sucesso.`);
    }
    console.log('Base de Conhecimento alimentada com sucesso!');
    // Teste opcional: busca de similaridade (Query: 'quero fazer um cartao de visita')
    const testQuery = 'quero fazer um cartao de visita';
    console.log(`\nTestando busca vetorial para a query: "${testQuery}"...`);
    let queryVector;
    if (embeddings) {
        queryVector = await embeddings.embedQuery(testQuery);
    }
    else {
        queryVector = Array(768).fill(0).map(() => Math.random() * 2 - 1);
    }
    const queryVectorString = `[${queryVector.join(',')}]`;
    // <=> calcula a cosine distance
    const resultados = await prisma_1.prisma.$queryRaw `
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
    await prisma_1.prisma.$disconnect();
});
