/**
 * Fluxo 14 · Ambiguidade impede identificar o produto
 * "Oi, preciso de cartão." — Cartão de visita? Postal? Fidelidade?
 * Agente pede clareza, cliente especifica e o fluxo segue normalmente.
 *
 * Estados: Boas-vindas → Identificar clarificar → Identificar →
 *          Coletar specs → Calcular → Apresentar → Aguardar aprov. →
 *          Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, cleanupUser, wait, uniquePhone } from './helpers';

const PHONE = uniquePhone(14);
const NAME = 'Natalia Teste F14';

async function turno(text: string, label: string): Promise<string> {
  await sendMsg(PHONE, NAME, text);
  await wait();
  const resp = await getLastBotResponse(PHONE);
  expect(resp).toBeTruthy();
  console.log(`[${label}] Bot: ${resp}`);
  return resp!;
}

describe('Fluxo 14 · Ambiguidade no produto solicitado', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve pedir clareza sobre o produto e fechar o pedido após identificação', async () => {
    await turno('Oi, preciso de cartão.', 'Boas-vindas + ambiguidade');
    await turno('Cartão de visita para a minha empresa.', 'Identificar clarificado');
    await turno('500 unidades, formato 9x5cm, frente colorida, papel couchê 300g.', 'Coletar specs');
    await turno('Tenho o arquivo em PDF com sangria de 3mm.', 'Validar arq.');
    await turno('Pode calcular o preço.', 'Calcular');
    await turno('Aprovado!', 'Aguardar aprov.');
    await turno('Vou retirar na loja.', 'Dados entrega');
    await turno('Confirmo.', 'Confirmar');
    await turno('Pode fechar.', 'Gerar O.S.');
    await turno('Obrigada! Até mais.', 'Encerrar');
  }, 110_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f14_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
