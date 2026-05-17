/**
 * Fluxo 7 · Reclamação como primeira mensagem
 * Cliente insatisfeito com pedido anterior. Bot não tem alçada para resolver
 * histórico — escalada imediata sem tentar coletar nada.
 *
 * Estados: Boas-vindas → Escalar
 */

import { sendMsg, getLastBotResponse, getSessionState, getSessionContext, getLastOS, cleanupUser, wait, uniquePhone, turno } from './helpers';

const PHONE = uniquePhone(7);
const NAME = 'Gabriela Teste F7';


describe('Fluxo 7 · Reclamação — escalada imediata', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve escalar imediatamente sem tentar coletar pedido novo', async () => {
    await turno(PHONE, NAME,
      'O pedido que fiz semana passada saiu completamente errado! As cores estão todas erradas e o tamanho é diferente do que pedi!',
      'ESCALAR_HUMANO',
      'Reclamação → Escalar'
    );
    await turno(PHONE, NAME,
      'Preciso falar com um atendente agora, isso é inaceitável!',
      'ESCALAR_HUMANO',
      'Confirmação escalada'
    );
  }, 300_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f7_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
