import { ragService } from '../services/rag.service';

async function test() {
  console.log('Testing RAG Service...');
  try {
    const result = await ragService.query('Oi, quero fazer cartão de visita');
    console.log('Success:', result.answer);
  } catch (error) {
    console.error('Error from Gemini API:');
    if (error instanceof Error) {
      console.error(error.message);
      // @ts-ignore
      if (error.response) console.error(error.response.data);
      // @ts-ignore
      if (error.status) console.error(`Status: ${error.status}`);
    } else {
      console.error(error);
    }
  }
}

test();
