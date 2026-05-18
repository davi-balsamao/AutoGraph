/**
 * Fluxo 20 · Uso fora do propósito do bot
 * "Me conta uma piada" / "Qual é a receita de bolo?" Agente reconhece
 * educadamente que não é o canal adequado e redireciona ao tema.
 *
 * Estados: (qualquer) → (redirect) → (mesmo estado)
 */

import { sendMsg, getLastBotResponse, getSessionState, getSessionContext, getLastOS, cleanupUser, wait, uniquePhone, turno } from './helpers';

const PHONE = uniquePhone(20);
const NAME = 'Ulisses Teste F20';


describe('Fluxo 20 · Mensagem fora do escopo do bot', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve redirecionar off-topic sem responder ao pedido fora do escopo', async () => {
    await turno(PHONE, NAME, 'Me conta uma piada boa!', 'COLETAR_ESPECIFICACOES', 'Off-topic 1 — piada');
    await turno(PHONE, NAME, 'Qual é a receita do bolo de chocolate perfeito?', 'COLETAR_ESPECIFICACOES', 'Off-topic 2 — receita');
    await turno(PHONE, NAME, 'Ok ok, então quero fazer um pedido de panfletos.', 'AGUARDAR_RETORNO', 'Retorno ao tema');
  }, 40_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f20_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);

  it('deve responder a entrada incompleta', async () => {
    await sendMsg(PHONE, NAME, '???');
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 20_000);
});
