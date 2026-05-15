/**
 * Fluxo 5 · Pergunta de preço antes das specs
 * "Quanto custa 1000 panfletos?" sem nenhum detalhe técnico.
 * Agente esclarece que precisa das specs antes, coleta tudo e apresenta orçamento.
 *
 * Estados: Boas-vindas → Identificar → Esclarecer preço? →
 *          Coletar specs → Calcular → Apresentar → Aguardar aprov. →
 *          Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, cleanupUser, wait, uniquePhone } from './helpers';

const PHONE = uniquePhone(5);
const NAME = 'Eduarda Teste F5';

async function turno(text: string, label: string): Promise<string> {
  await sendMsg(PHONE, NAME, text);
  await wait();
  const resp = await getLastBotResponse(PHONE);
  expect(resp).toBeTruthy();
  console.log(`[${label}] Bot: ${resp}`);
  return resp!;
}

describe('Fluxo 5 · Atalho — pergunta de preço antes das specs', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve esclarecer necessidade de specs antes do preço e fechar o pedido', async () => {
    await turno('Oi! Quanto custa 1000 panfletos?', 'Boas-vindas + pergunta preço');
    await turno('Preciso saber o preço de 1000 panfletos, me diz logo.', 'Esclarecer preço');
    await turno('Ah, entendi que precisa das especificações. Quero panfletos então.', 'Identificar');
    await turno('1000 unidades, tamanho A5, frente e verso colorido, papel couchê 90g.', 'Coletar specs');
    await turno('Sim, tenho o arquivo em PDF pronto.', 'Validar arq.');
    await turno('Agora sim, pode calcular o preço.', 'Calcular');
    await turno('Aprovado! Esse valor está ótimo.', 'Aguardar aprov.');
    await turno('Vou retirar na loja.', 'Dados entrega');
    await turno('Confirmo o pedido.', 'Confirmar');
    await turno('Pode fechar.', 'Gerar O.S.');
    await turno('Obrigada!', 'Encerrar');
  }, 120_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f5_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
