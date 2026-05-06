/**
 * test-e2e-webhook.ts — Teste End-to-End do fluxo completo
 *
 * Simula o envio de mensagens do WhatsApp para o webhook local e
 * exibe os resultados. Testa o fluxo: Webhook → RAG → Guardrails → Resposta.
 *
 * Executar: npm run test:e2e
 */

import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

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

import { webhookService } from '../services/webhook.service';
import { parseWhatsAppPayload } from '../utils/whatsapp.parser';

async function sendMessage(from: string, name: string, text: string) {
  console.log(`\n📤 [${name}] → "${text}"`);

  const payload = buildPayload(from, name, text);
  const messages = parseWhatsAppPayload(payload);

  if (messages.length === 0) {
    console.error('Falha ao parsear payload de teste');
    return;
  }

  try {
    // Chama o serviço diretamente (bypass HTTP)
    await webhookService.processIncomingMessage(messages[0]);
  } catch (err: any) {
    console.log(`   ⚠️ Erro no processamento:`, err);
  }

  console.log('   ✅ Fluxo finalizado.\n');
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
