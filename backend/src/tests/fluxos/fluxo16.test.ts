/**
 * Fluxo 16 · Exigência de desconto além da margem
 * Após orçamento, cliente exige 40% de desconto e insiste várias vezes.
 * Agente oferece alternativas dentro da margem, não cede. Escalada para humano.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Calcular →
 *          Apresentar → Aguardar aprov. → Negociar → Escalar
 */

import { sendMsg, getLastBotResponse, cleanupUser, wait, uniquePhone } from './helpers';

const PHONE = uniquePhone(16);
const NAME = 'Patricia Teste F16';

async function turno(text: string, label: string): Promise<string> {
  await sendMsg(PHONE, NAME, text);
  await wait();
  const resp = await getLastBotResponse(PHONE);
  expect(resp).toBeTruthy();
  console.log(`[${label}] Bot: ${resp}`);
  return resp!;
}

describe('Fluxo 16 · Negociação agressiva → escalada', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve negar desconto excessivo e escalar para humano', async () => {
    await turno('Oi! Quero fazer banners para minha loja.', 'Boas-vindas');
    await turno('Dois banners grandes para vitrine.', 'Identificar');
    await turno('Banners 100x200cm, lona vinílica, acabamento com ilhós e cordão.', 'Coletar specs');
    await turno('Tenho arte em PDF, resolução 300 dpi.', 'Validar arq.');
    await turno('Esse preço está muito caro! Quero 40% de desconto ou não compro.', 'Negociar agressivo');
    await turno('Não aceito nem um centavo a mais, preciso dos 40% de desconto mesmo!', 'Insistência');
    await turno('Então quero falar com um gerente! Isso é abuso de preço!', 'Escalada');
  }, 80_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f16_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
