import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY;

const MODEL = 'gemini-flash-lite-latest';

async function testApi() {
  console.log(`Testing model: ${MODEL}`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Oi" }] }]
    })
  });

  const data = await response.json();
  console.log('Status:', response.status);
