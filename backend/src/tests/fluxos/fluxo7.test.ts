/**
 * Fluxo 7 · Reclamação como primeira mensagem
 * Cliente insatisfeito com pedido anterior. Bot não tem alçada para resolver
 * histórico — escalada imediata sem tentar coletar nada.
 *
 * Estados: Boas-vindas → Escalar
 */

import { sendMsg, getLastBotResponse, cleanupUser, wait, uniquePhone } from './helpers';

const PHONE = uniquePhone(7);
const NAME = 'Gabriela Teste F7';

async function turno(text: string, label: string): Promise<string> {
  await sendMsg(PHONE, NAME, text);
  await wait();
  const resp = await getLastBotResponse(PHONE);
  expect(resp).toBeTruthy();
  console.log(`[${label}] Bot: ${resp}`);
  return resp!;
}

describe('Fluxo 7 · Reclamação — escalada imediata', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve escalar imediatamente sem tentar coletar pedido novo', async () => {
    await turno(
      'O pedido que fiz semana passada saiu completamente errado! As cores estão todas erradas e o tamanho é diferente do que pedi!',
      'Reclamação → Escalar'
    );
    await turno(
      'Preciso falar com um responsável agora, isso é inaceitável!',
      'Confirmação escalada'
    );
  }, 30_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f7_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
