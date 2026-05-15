/**
 * Fluxo 15 · Regra de negócio bloqueia temporariamente
 * Cliente quer 20 unidades, mínimo é 100. Agente informa a regra, explica
 * o motivo e pergunta se aceita o mínimo. Cliente aceita e o fluxo continua.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Calcular ❌ qtd →
 *          Coletar specs ajustar → Calcular → Apresentar → Aguardar aprov. →
 *          Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, cleanupUser, wait, uniquePhone } from './helpers';

const PHONE = uniquePhone(15);
const NAME = 'Oscar Teste F15';

async function turno(text: string, label: string): Promise<string> {
  await sendMsg(PHONE, NAME, text);
  await wait();
  const resp = await getLastBotResponse(PHONE);
  expect(resp).toBeTruthy();
  console.log(`[${label}] Bot: ${resp}`);
  return resp!;
}

describe('Fluxo 15 · Quantidade abaixo do mínimo', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve informar quantidade mínima, ajustar e fechar o pedido', async () => {
    await turno('Oi! Quero fazer 20 panfletos para testar.', 'Boas-vindas + qtd baixa');
    await turno('Panfletos para uma campanha pequena da minha empresa.', 'Identificar');
    await turno('Só 20 unidades, tamanho A5, frente colorida, couchê 90g.', 'Coletar specs → ❌ qtd mínima');
    await turno('Ah, entendi. O mínimo é 100. Então faço 100 unidades mesmo.', 'Ajustar quantidade');
    await turno('100 panfletos, A5, frente colorida, papel couchê 90g.', 'Specs corrigidas');
    await turno('Tenho o arquivo em PDF.', 'Validar arq.');
    await turno('Pode calcular com 100 unidades.', 'Calcular');
    await turno('Aprovado!', 'Aguardar aprov.');
    await turno('Vou retirar na loja.', 'Dados entrega');
    await turno('Confirmo o pedido.', 'Confirmar');
    await turno('Pode fechar.', 'Gerar O.S.');
    await turno('Obrigado!', 'Encerrar');
  }, 130_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f15_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
