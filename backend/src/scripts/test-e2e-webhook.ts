/**
 * test-e2e-webhook.ts — Teste End-to-End do fluxo completo
 *
 * Simula o envio de mensagens do WhatsApp para o webhook local e
 * exibe os resultados. Testa o fluxo: Webhook → RAG → Guardrails → Resposta.
 *
 * Executar: npm run test:e2e
 */

import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const BASE_URL = `http://127.0.0.1:${process.env.PORT || 3000}`;

function buildPayload(from: string, name: string, text: string) {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '123',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15551234567',
                phone_number_id: '123456',
              },
              contacts: [
                {
                  profile: { name },
                  wa_id: from,
                },
              ],
              messages: [
                {
                  from,
                  id: `wamid.test_${Date.now()}`,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  text: { body: text },
                  type: 'text',
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };
}

async function sendMessage(from: string, name: string, text: string) {
  console.log(`\n📤 [${name}] → "${text}"`);

  const payload = buildPayload(from, name, text);
  const bodyString = JSON.stringify(payload);
  const appSecret = process.env.APP_SECRET || '';
  const signature = 'sha256=' + crypto.createHmac('sha256', appSecret).update(bodyString).digest('hex');

  try {
    // Realiza requisição HTTP para o webhook em vez de bypassar
    const res = await fetch(`${BASE_URL}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': signature,
      },
      body: bodyString,
    });
    
    if (res.ok) {
       console.log('   ✅ Requisição aceita (200 OK) pelo Webhook. Assinatura validada.');
       // Aguarda um momento para permitir o processamento assíncrono antes do próximo teste
       await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
       console.log(`   ❌ Erro HTTP ${res.status}: Requisição rejeitada pelo Webhook.`);
    }
  } catch (err: any) {
    console.log(`   ⚠️ Erro de conexão com o servidor:`, err.message);
  }
}

async function main() {
  console.log('============================================');
  console.log('  TESTE E2E — Fluxo Completo do Webhook');
  console.log(`  Servidor: ${BASE_URL}`);
  console.log('============================================');

  // Teste 1: Mensagem de triagem simples
  await sendMessage('5531999990001', 'Davi Teste', 'Oi, quero fazer cartão de visita');

  // Teste 2: Pergunta fora do escopo
  await sendMessage('5531999990002', 'Maria Teste', 'Qual a previsão do tempo?');

  // Teste 3: Produto que existe (Banner)
  await sendMessage('5531999990003', 'João Teste', 'Preciso de um banner grande para minha loja');

  console.log('\n============================================');
  console.log('  Testes concluídos! Verifique os logs do servidor.');
  console.log('============================================\n');
}

main().catch(console.error);
