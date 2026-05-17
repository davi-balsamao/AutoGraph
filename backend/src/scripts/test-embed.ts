import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const safeApiKey = process.env.GOOGLE_API_KEY;
  console.log('API Key present:', !!safeApiKey);

  const embeddings = new GoogleGenerativeAIEmbeddings({
    modelName: 'gemini-embedding-2', // standard model
    apiKey: safeApiKey,
  });

  console.log('--- Testing embedDocuments ---');
  try {
    const start = Date.now();
    const docsVecs = await embeddings.embedDocuments(['Olá mundo', 'Teste de embedding']);
    console.log(`embedDocuments succeeded in ${Date.now() - start}ms! Vector length:`, docsVecs[0]?.length);
  } catch (err: any) {
    console.error('embedDocuments failed:', err.message || err);
  }

  console.log('--- Testing embedQuery ---');
  try {
    const start = Date.now();
    const queryVec = await embeddings.embedQuery('Qual é a diferença entre laminação fosca e brilhosa?');
    console.log(`embedQuery succeeded in ${Date.now() - start}ms! Vector length:`, queryVec?.length);
  } catch (err: any) {
    console.error('embedQuery failed:', err.message || err);
  }
}

main().catch(console.error);
