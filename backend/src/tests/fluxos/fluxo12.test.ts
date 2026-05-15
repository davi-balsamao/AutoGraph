/**
 * Fluxo 12 · Condição financeira influencia decisão
 * Cliente precisa parcelar antes de decidir. Agente informa as opções.
 * Com base nisso, cliente decide avançar com o pedido.
 *
 * Estados: Boas-vindas → Identificar → Esclarecer pag? → Coletar specs →
 *          Calcular → Apresentar → Aguardar aprov. → Dados entrega →
 *          Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, cleanupUser, wait, uniquePhone } from './helpers';

const PHONE = uniquePhone(12);
const NAME = 'Luana Teste F12';

async function turno(text: string, label: string): Promise<string> {
  await sendMsg(PHONE, NAME, text);
  await wait();
  const resp = await getLastBotResponse(PHONE);
  expect(resp).toBeTruthy();
  console.log(`[${label}] Bot: ${resp}`);
  return resp!;
}

describe('Fluxo 12 · Dúvida sobre pagamento antes de decidir', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve informar formas de pagamento e fechar o pedido', async () => {
    await turno('Oi! Tenho uma dúvida sobre pagamento antes de fazer o pedido.', 'Boas-vindas');
    await turno('Quero panfletos, mas primeiro preciso saber se posso parcelar.', 'Identificar + Esclarecer pag.');
    await turno('Vocês aceitam parcelamento no cartão? Em quantas vezes?', 'Esclarecer pagamento');
    await turno('Ótimo, então posso parcelar. Quero fazer panfletos.', 'Coletar specs');
    await turno('1000 unidades, tamanho A5, frente e verso colorido, papel couchê 90g.', 'Specs completas');
    await turno('Sim, tenho o arquivo de arte em PDF.', 'Validar arq.');
    await turno('Pode calcular o orçamento.', 'Calcular');
    await turno('Aprovado! Vou parcelar em 3x.', 'Aguardar aprov.');
    await turno('Entrega no endereço: Rua XV de Novembro, 50, Curitiba – PR.', 'Dados entrega');
    await turno('Confirmo o pedido.', 'Confirmar');
    await turno('Pode fechar.', 'Gerar O.S.');
    await turno('Obrigada!', 'Encerrar');
  }, 130_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f12_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
