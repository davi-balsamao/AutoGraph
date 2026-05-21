"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const google_genai_1 = require("@langchain/google-genai");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function main() {
    const safeApiKey = process.env.GOOGLE_API_KEY;
    console.log('API Key present:', !!safeApiKey);
    const embeddings = new google_genai_1.GoogleGenerativeAIEmbeddings({
        modelName: 'gemini-embedding-2', // standard model
        apiKey: safeApiKey,
    });
    console.log('--- Testing embedDocuments ---');
    try {
        const start = Date.now();
        const docsVecs = await embeddings.embedDocuments(['Olá mundo', 'Teste de embedding']);
        console.log(`embedDocuments succeeded in ${Date.now() - start}ms! Vector length:`, docsVecs[0]?.length);
    }
    catch (err) {
        console.error('embedDocuments failed:', err.message || err);
    }
    console.log('--- Testing embedQuery ---');
    try {
        const start = Date.now();
        const queryVec = await embeddings.embedQuery('Qual é a diferença entre laminação fosca e brilhosa?');
        console.log(`embedQuery succeeded in ${Date.now() - start}ms! Vector length:`, queryVec?.length);
    }
    catch (err) {
        console.error('embedQuery failed:', err.message || err);
    }
}
main().catch(console.error);
