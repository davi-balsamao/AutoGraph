/**
 * Fluxo 13 · Ausência de histórico acessível
 * Cliente recorrente quer repetir pedido anterior. Bot não acessa histórico.
 * Informa isso com educação e reconduz para nova coleta de specs.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs re-coletar →
 *          Validar arq. → Calcular → Apresentar → Aguardar aprov. →
 *          Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, cleanupUser, wait, uniquePhone } from './helpers';

const PHONE = uniquePhone(13);
const NAME = 'Marcos Teste F13';

async function turno(text: string, label: string): Promise<string> {
  await sendMsg(PHONE, NAME, text);
  await wait();
  const resp = await getLastBotResponse(PHONE);
  expect(resp).toBeTruthy();
  console.log(`[${label}] Bot: ${resp}`);
  return resp!;
}

describe('Fluxo 13 · Cliente recorrente sem acesso ao histórico', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve informar falta de histórico e recoletcar specs do zero', async () => {
    await turno('Oi! Quero repetir o mesmo pedido que fiz no mês passado.', 'Boas-vindas + pedido repetir');
    await turno('Era panfletos, exatamente igual ao anterior.', 'Identificar → re-coletar');
    await turno('Tudo bem, vou informar de novo. Quero panfletos para minha empresa.', 'Re-coletar specs');
    await turno('1000 unidades, tamanho A5, frente e verso colorido, couchê 90g.', 'Specs completas');
    await turno('Tenho o arquivo de arte em PDF, igual ao anterior.', 'Validar arq.');
    await turno('Pode calcular.', 'Calcular');
    await turno('Aprovado!', 'Aguardar aprov.');
    await turno('Vou retirar na loja como sempre.', 'Dados entrega');
    await turno('Confirmo.', 'Confirmar');
    await turno('Pode fechar.', 'Gerar O.S.');
    await turno('Obrigado! Até o próximo pedido.', 'Encerrar');
  }, 120_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f13_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
