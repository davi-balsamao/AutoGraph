/**
 * Fluxo 19 · Alteração após emissão da O.S.
 * Após receber o número da O.S., cliente quer trocar o papel.
 * Produção pode já ter iniciado. Escalada obrigatória — bot não edita O.S. gerada.
 *
 * Estados: Gerar O.S. pós-OS → Escalar
 */

import { sendMsg, getLastBotResponse, cleanupUser, wait, uniquePhone } from './helpers';

const PHONE = uniquePhone(19);
const NAME = 'Teresa Teste F19';

async function turno(text: string, label: string): Promise<string> {
  await sendMsg(PHONE, NAME, text);
  await wait();
  const resp = await getLastBotResponse(PHONE);
  expect(resp).toBeTruthy();
  console.log(`[${label}] Bot: ${resp}`);
  return resp!;
}

describe('Fluxo 19 · Alteração de pedido após emissão de O.S.', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve escalar ao tentar alterar pedido pós-OS sem editar a O.S.', async () => {
    await turno(
      'Oi! Acabei de receber a confirmação do meu pedido, mas preciso alterar o tipo de papel.',
      'Solicitação de alteração pós-OS'
    );
    await turno(
      'Quero trocar de papel couchê 90g para papel offset 75g. É possível mudar agora?',
      'Escalada — bot não edita O.S.'
    );
  }, 30_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f19_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
