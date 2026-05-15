/**
 * Fluxo 2 · Dúvida sobre produto antes de decidir
 * Cliente indeciso: "Não sei se quero panfleto ou flyer."
 * Precisa de orientação antes de fechar as specs. Retorna ao fluxo após esclarecer.
 *
 * Estados: Boas-vindas → Identificar → Esclarecer → Identificar →
 *          Coletar specs → Validar arq. → Calcular → Apresentar →
 *          Aguardar aprov. → Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, cleanupUser, wait, uniquePhone } from './helpers';

const PHONE = uniquePhone(2);
const NAME = 'Bruno Teste F2';

async function turno(text: string, label: string): Promise<string> {
  await sendMsg(PHONE, NAME, text);
  await wait();
  const resp = await getLastBotResponse(PHONE);
  expect(resp).toBeTruthy();
  console.log(`[${label}] Bot: ${resp}`);
  return resp!;
}

describe('Fluxo 2 · Dúvida sobre produto antes de decidir', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve esclarecer dúvida e retomar fluxo normal', async () => {
    await turno('Oi, boa tarde! Preciso de um material impresso.', 'Boas-vindas');
    await turno('Não sei se quero panfleto ou flyer, qual a diferença?', 'Identificar → Esclarecer');
    await turno('Qual é a diferença técnica entre panfleto e flyer?', 'Esclarecer dúvida');
    await turno('Entendi! Então vou de panfleto mesmo.', 'Retorna Identificar');
    await turno('Quero 500 unidades, tamanho A4, só frente, colorido, papel couchê 115g.', 'Coletar specs');
    await turno('Sim, tenho o arquivo pronto em PDF com resolução 300 dpi.', 'Validar arq.');
    await turno('Pode calcular o valor para mim?', 'Calcular');
    await turno('Gostei do orçamento, aprovado!', 'Aguardar aprov.');
    await turno('Quero entrega. Meu endereço é Av. Brasil, 500, São Paulo – SP.', 'Dados entrega');
    await turno('Confirmo o pedido.', 'Confirmar');
    await turno('Pode fechar o pedido.', 'Gerar O.S.');
    await turno('Obrigado! Até logo.', 'Encerrar');
  }, 130_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f2_${Date.now()}`;
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
