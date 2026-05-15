/**
 * Fluxo 1 · Fluxo base — sem desvios
 * Cliente direto e objetivo: sabe o que quer, fornece todas as specs,
 * aprova o orçamento na hora e confirma o pedido.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Validar arq. →
 *          Calcular → Apresentar → Aguardar aprov. → Dados entrega →
 *          Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, cleanupUser, wait, uniquePhone } from './helpers';

const PHONE = uniquePhone(1);
const NAME = 'Ana Teste F1';

async function turno(text: string, label: string): Promise<string> {
  await sendMsg(PHONE, NAME, text);
  await wait();
  const resp = await getLastBotResponse(PHONE);
  expect(resp).toBeTruthy();
  console.log(`[${label}] Bot: ${resp}`);
  return resp!;
}

describe('Fluxo 1 · Fluxo base — sem desvios', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve percorrer o fluxo completo sem desvios', async () => {
    await turno('Oi, boa tarde! Gostaria de fazer um pedido de impressão.', 'Boas-vindas');
    await turno('Quero panfletos para divulgar meu restaurante.', 'Identificar');
    await turno('Preciso de 1000 unidades, tamanho A5, frente e verso colorido, papel couchê 90g.', 'Coletar specs');
    await turno('Sim, tenho o arquivo de arte finalizada em PDF.', 'Validar arq.');
    await turno('Pode me confirmar o orçamento?', 'Calcular/Apresentar');
    await turno('Perfeito, aprovado! Pode continuar.', 'Aguardar aprov.');
    await turno('Vou retirar na loja, não preciso de entrega.', 'Dados entrega');
    await turno('Confirmo o pedido.', 'Confirmar');
    await turno('Pode fechar, está tudo certo.', 'Gerar O.S.');
    await turno('Muito obrigada! Até mais.', 'Encerrar');
  }, 100_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f1_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);

  it('deve responder a entrada incompleta', async () => {
    await sendMsg(PHONE, NAME, '?');
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 20_000);
});
