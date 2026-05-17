/**
 * Helpers compartilhados para testes de fluxo.
 *
 * Premissas:
 *  - O servidor já está rodando (testes são E2E contra processo separado).
 *  - USE_MOCK_WHATSAPP=true deve estar definido no servidor para evitar chamadas
 *    reais à API da Meta.
 *  - APP_SECRET no servidor deve coincidir com process.env.APP_SECRET | 'test_secret'.
 */

import crypto from 'crypto';
import { prisma } from '../../config/prisma';

export const BASE_URL = `http://127.0.0.1:${process.env.PORT || 3000}`;
const APP_SECRET = process.env.APP_SECRET || 'test_secret';

/** Cria payload no formato do webhook da Meta. */
export function buildPayload(from: string, name: string, text: string, msgId?: string) {
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
            id: msgId || `wamid.test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
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

/** Envia mensagem via webhook com assinatura HMAC válida. */
export async function sendMsg(from: string, name: string, text: string, msgId?: string) {
  const payload = buildPayload(from, name, text, msgId);
  const bodyString = JSON.stringify(payload);
  const signature = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(bodyString).digest('hex');

  const res = await fetch(`${BASE_URL}/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Hub-Signature-256': signature,
    },
    body: bodyString,
  });

  if (!res.ok) throw new Error(`Webhook rejeitou a requisição: ${res.status}`);
}

/** Retorna o texto da última resposta do BOT para o telefone dado. */
export async function getLastBotResponse(telefone: string): Promise<string | null> {
  const cliente = await prisma.usuario.findFirst({ where: { telefone } });
  if (!cliente) return null;

  const lastMsg = await prisma.mensagens.findFirst({
    where: { usuarioId: cliente.id, origem: 'BOT' },
    orderBy: { criadoEm: 'desc' },
  });
  if (!lastMsg) return null;

  const payload = lastMsg.payload as any;
  return payload.text?.body ?? payload.text ?? JSON.stringify(payload);
}

/**
 * Remove todos os dados do usuário de teste do banco.
 * Deve ser chamado em beforeAll E afterAll para garantir estado limpo
 * mesmo que a execução anterior tenha sido interrompida.
 */
export async function cleanupUser(telefone: string) {
  const user = await prisma.usuario.findFirst({ where: { telefone } });
  if (!user) return;

  // Respeita FK: mensagens → ordensDeServico → sessaoAtendimento → usuario
  await prisma.mensagens.deleteMany({ where: { usuarioId: user.id } });
  await prisma.sessaoAtendimento.deleteMany({ where: { clienteId: user.id } });
  await prisma.ordensDeServico.deleteMany({ where: { clienteId: user.id } });
  await prisma.usuario.delete({ where: { id: user.id } });
}

/** Retorna o estado FSM atual da sessão ativa do usuário. */
export async function getSessionState(telefone: string): Promise<string | null> {
  const cliente = await prisma.usuario.findFirst({ where: { telefone } });
  if (!cliente) return null;

  const sessao = await prisma.sessaoAtendimento.findFirst({
    where: { clienteId: cliente.id, ativa: true },
    orderBy: { atualizadoEm: 'desc' },
  });
  return sessao?.estadoAtual ?? null;
}

/** Retorna o contexto JSON da sessão ativa (produto, specs, orcamento, entrega, osId…). */
export async function getSessionContext(telefone: string): Promise<Record<string, any> | null> {
  const cliente = await prisma.usuario.findFirst({ where: { telefone } });
  if (!cliente) return null;

  const sessao = await prisma.sessaoAtendimento.findFirst({
    where: { clienteId: cliente.id, ativa: true },
    orderBy: { atualizadoEm: 'desc' },
  });
  return (sessao?.contexto as Record<string, any>) ?? null;
}

/** Retorna a última OS criada para o telefone dado. */
export async function getLastOS(telefone: string) {
  const cliente = await prisma.usuario.findFirst({ where: { telefone } });
  if (!cliente) return null;

  return prisma.ordensDeServico.findFirst({
    where: { clienteId: cliente.id },
    orderBy: { criadoEm: 'desc' },
  });
}

/** Aguarda processamento assíncrono da IA (em ms). */
export const wait = (ms = 8000) => new Promise<void>(r => setTimeout(r, ms));

/** Gera número de telefone único por fluxo para evitar colisões entre suites. */
export function uniquePhone(fluxoId: number): string {
  const suffix = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `5531${fluxoId.toString().padStart(2, '0')}${suffix}`;
}

/**
 * Envia mensagem e faz polling do estado a cada 1.5s até bater o esperado ou
 * expirar o timeout. Para imediatamente (expect) se o estado divergir.
 * Tolerante a variações de latência do LLM/embedding.
 *
 * @param timeoutMs  Default 20s. Use 30s em turnos com chains de LLM.
 */
export async function turno(
  phone: string,
  name: string,
  text: string,
  expectedState: string,
  label: string,
  timeoutMs = 45_000,
): Promise<{ state: string; resp: string }> {
  // Throttle requests to stay within Gemini Free Tier rate limits (15 RPM)
  await wait(12000);

  // Obter o ID da última mensagem do BOT antes de enviar a nova
  const clienteAntes = await prisma.usuario.findFirst({ where: { telefone: phone } });
  const lastBotMsgAntes = clienteAntes
    ? await prisma.mensagens.findFirst({
        where: { usuarioId: clienteAntes.id, origem: 'BOT' },
        orderBy: { criadoEm: 'desc' },
      })
    : null;
  const lastBotMsgIdAntes = lastBotMsgAntes?.id ?? null;

  await sendMsg(phone, name, text);

  const deadline = Date.now() + timeoutMs;
  let state: string | null = null;
  let resp:  string | null = null;

  while (Date.now() < deadline) {
    await wait(1_500);
    state = await getSessionState(phone);

    // Verificar se uma nova mensagem do BOT foi registrada
    const clienteAtual = await prisma.usuario.findFirst({ where: { telefone: phone } });
    const lastBotMsgAtual = clienteAtual
      ? await prisma.mensagens.findFirst({
          where: { usuarioId: clienteAtual.id, origem: 'BOT' },
          orderBy: { criadoEm: 'desc' },
        })
      : null;
    const lastBotMsgIdAtual = lastBotMsgAtual?.id ?? null;

    if (state === expectedState && lastBotMsgIdAtual !== lastBotMsgIdAntes && lastBotMsgIdAtual !== null) {
      const payload = lastBotMsgAtual!.payload as any;
      resp = payload.text?.body ?? payload.text ?? JSON.stringify(payload);
      break;
    }
  }

  console.log(`\n[${label}]`);
  console.log(`  Cliente: "${text}"`);
  console.log(`  Estado : ${state}  (esperado: ${expectedState})`);
  console.log(`  Bot    : ${resp}`);

  expect(state).toBe(expectedState);
  expect(resp).toBeTruthy();

  return { state: state!, resp: resp! };
}
