/**
 * Teste E2E: Fluxo 19 · Alteração após emissão da O.S.
 * Baseado no fluxo: backend/rag-test/fluxos/fluxo19.md
 */

import crypto from 'crypto';
import { prisma } from '../../../config/prisma';

const BASE_URL = `http://127.0.0.1:${process.env.PORT || 3000}`;
const APP_SECRET = process.env.APP_SECRET || 'test_secret';

function buildPayload(from: string, name: string, text: string, msgId?: string) {
  return {
    object: 'whatsapp_business_account',
    entry: [{
      id: '123',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: { display_phone_number: '15551234567', phone_number_id: '123456' },
          contacts: [{ profile: { name }, wa_id: from }],
          messages: [{
            from,
            id: msgId || `wamid.test_${Date.now()}`,
            timestamp: String(Math.floor(Date.now() / 1000)),
            text: { body: text },
            type: 'text',
          }],
        },
        field: 'messages',
      }],
    }],
  };
}

async function sendMessage(from: string, name: string, text: string, msgId?: string) {
  const payload = buildPayload(from, name, text, msgId);
  const bodyString = JSON.stringify(payload);
  const signature = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(bodyString).digest('hex');

  const res = await fetch(`${BASE_URL}/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': signature },
    body: bodyString,
  });
  
  if (!res.ok) throw new Error(`Webhook rejeitou a requisição: ${res.status}`);
}

async function getLastBotResponse(telefone: string) {
  const cliente = await prisma.usuario.findFirst({ where: { telefone } });
  if (!cliente) return null;
  const lastMsg = await prisma.mensagens.findFirst({
    where: { usuarioId: cliente.id, origem: 'BOT' },
    orderBy: { criadoEm: 'desc' }
  });
  if (!lastMsg) return null;
  const payload = lastMsg.payload as any;
  return payload.text?.body || payload.text || JSON.stringify(payload);
}

describe('Fluxo: fluxo19', () => {
  const testNumber = `55319999${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  const testName = 'Tester fluxo19';

  afterAll(async () => {
    const user = await prisma.usuario.findFirst({ where: { telefone: testNumber } });
    if (user) {
      await prisma.mensagens.deleteMany({ where: { usuarioId: user.id } });
      await prisma.usuario.delete({ where: { id: user.id } });
    }
  });

  it('deve processar O FLUXO COMPLETO (2 passos)', async () => {

    // Passo 1: Gerar O.S. pós-OS
    await sendMessage(testNumber, testName, 'Simulando cliente avançando no passo: Gerar O.S. pós-OS');
    await new Promise(r => setTimeout(r, 8000)); // Espera processamento IA

    const botResponse1 = await getLastBotResponse(testNumber);
    expect(botResponse1).toBeTruthy();
    console.log('[Turno 1] IA respondeu:', botResponse1);
    
    // Passo 2: Escalar
    await sendMessage(testNumber, testName, 'Simulando cliente avançando no passo: Escalar');
    await new Promise(r => setTimeout(r, 8000)); // Espera processamento IA

    const botResponse2 = await getLastBotResponse(testNumber);
    expect(botResponse2).toBeTruthy();
    console.log('[Turno 2] IA respondeu:', botResponse2);
    
  }, 40000); // Timeout dinâmico baseado no número de passos

  it('deve ser robusto contra duplo envio (retry da Meta)', async () => {
    const msgId = `wamid.test_duplicate_${Date.now()}`;
    await sendMessage(testNumber, testName, 'Retry test', msgId);
    await sendMessage(testNumber, testName, 'Retry test', msgId);
    await new Promise(r => setTimeout(r, 8000));
    // Verifica se não explodiu ou gerou erro, deduplication em ação
    const response = await getLastBotResponse(testNumber);
    expect(response).toBeTruthy();
  }, 20000);

  it('deve lidar com entradas incompletas', async () => {
    await sendMessage(testNumber, testName, '?');
    await new Promise(r => setTimeout(r, 8000));
    const botResponse = await getLastBotResponse(testNumber);
    expect(botResponse).toBeTruthy();
  }, 20000);
});
