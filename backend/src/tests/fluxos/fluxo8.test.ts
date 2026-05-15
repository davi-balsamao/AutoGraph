/**
 * Fluxo 8 · Ciclo completo sem conversão
 * Cliente pede orçamento para comparar preços. Recebe, agradece e diz
 * "vou pensar". Agente encerra sem insistir ou forçar pedido.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Calcular →
 *          Apresentar → Aguardar aprov. recusa → Encerrar
 */

import { sendMsg, getLastBotResponse, cleanupUser, wait, uniquePhone } from './helpers';

const PHONE = uniquePhone(8);
const NAME = 'Henrique Teste F8';

async function turno(text: string, label: string): Promise<string> {
  await sendMsg(PHONE, NAME, text);
  await wait();
  const resp = await getLastBotResponse(PHONE);
  expect(resp).toBeTruthy();
  console.log(`[${label}] Bot: ${resp}`);
  return resp!;
}

describe('Fluxo 8 · Orçamento sem conversão', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve fornecer orçamento e encerrar sem insistir após recusa', async () => {
    await turno('Oi! Quero apenas um orçamento para comparar preços.', 'Boas-vindas');
    await turno('Panfletos para minha loja.', 'Identificar');
    await turno('1000 unidades, tamanho A5, frente e verso colorido, couchê 90g.', 'Coletar specs');
    await turno('Pode calcular o preço para mim.', 'Calcular');
    await turno('Obrigado pelo orçamento, vou pensar e talvez retorne mais tarde.', 'Recusa/Aguardar');
    await turno('Por enquanto não vou fechar, até mais!', 'Encerrar');
  }, 70_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f8_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
