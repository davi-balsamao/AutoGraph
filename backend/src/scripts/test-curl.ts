import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const apiKey = process.env.GOOGLE_API_KEY;
const model = 'gemini-flash-latest';

async function testDirectFetch() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const body = {
    contents: [
      {
        parts: [
          {
            text: "Você é um extrator de entidades de uma conversa de atendimento de gráfica. Responda 'OK' se recebeu esta mensagem."
          }
        ]
      }
    ]
  };

  console.log('Sending direct POST fetch request...');
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    console.log(`HTTP Status: ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log(`Response received in ${Date.now() - start}ms:`);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testDirectFetch();
