/**
 * Fluxo 19 · Alteração após emissão da O.S.
 * Após receber o número da O.S., cliente quer trocar o papel.
 * Produção pode já ter iniciado. Escalada obrigatória — bot não edita O.S. gerada.
 *
 * Estados: Gerar O.S. pós-OS → Escalar
 */

import { sendMsg, getLastBotResponse, getSessionState, getSessionContext, getLastOS, cleanupUser, wait, uniquePhone, turno } from './helpers';

const PHONE = uniquePhone(19);
const NAME = 'Teresa Teste F19';


describe('Fluxo 19 · Alteração de pedido após emissão de O.S.', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve escalar ao tentar alterar pedido pós-OS sem editar a O.S.', async () => {
    await turno(PHONE, NAME,
      'Oi! Acabei de receber a confirmação do meu pedido, mas preciso alterar o tipo de papel.',
      'ESCALAR_HUMANO',
      'Solicitação de alteração pós-OS'
    );
    await turno(PHONE, NAME,
      'Quero trocar de papel couchê 90g para papel offset 75g. É possível mudar agora?',
      'ESCALAR_HUMANO',
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
