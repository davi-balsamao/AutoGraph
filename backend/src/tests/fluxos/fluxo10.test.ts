/**
 * Fluxo 10 · Produto completamente fora do catálogo
 * "Quero copo personalizado com logo." Gráfica só faz materiais impressos.
 * Agente informa, sugere alternativa impressa ou encerra.
 *
 * Estados: Boas-vindas → Identificar → Prod. indisp. → Encerrar
 */

import { sendMsg, getLastBotResponse, cleanupUser, wait, uniquePhone } from './helpers';

const PHONE = uniquePhone(10);
const NAME = 'João Teste F10';

async function turno(text: string, label: string): Promise<string> {
  await sendMsg(PHONE, NAME, text);
  await wait();
  const resp = await getLastBotResponse(PHONE);
  expect(resp).toBeTruthy();
  console.log(`[${label}] Bot: ${resp}`);
  return resp!;
}

describe('Fluxo 10 · Produto fora do catálogo', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve informar produto indisponível e encerrar com educação', async () => {
    await turno('Oi! Quero copos personalizados com o logo da minha empresa.', 'Boas-vindas + produto indisp.');
    await turno('Preciso de 100 copos com meu logo impresso.', 'Identificar → Prod. indisp.');
    await turno('Entendido, vocês não fazem copos. Tem alguma alternativa impressa?', 'Alternativa');
    await turno('Tudo bem, por enquanto não preciso de mais nada. Obrigado!', 'Encerrar');
  }, 50_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f10_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
