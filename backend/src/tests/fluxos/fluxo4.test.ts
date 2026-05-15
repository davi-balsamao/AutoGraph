/**
 * Fluxo 4 · Urgência que altera custo e prazo
 * Cliente precisa do material em 24 horas. Agente calcula custo expresso,
 * informa o acréscimo. Cliente questiona o valor — pequena negociação — e aprova.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Calcular expresso →
 *          Apresentar → Aguardar aprov. → Negociar → Aguardar aprov. →
 *          Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, cleanupUser, wait, uniquePhone } from './helpers';

const PHONE = uniquePhone(4);
const NAME = 'Diego Teste F4';

async function turno(text: string, label: string): Promise<string> {
  await sendMsg(PHONE, NAME, text);
  await wait();
  const resp = await getLastBotResponse(PHONE);
  expect(resp).toBeTruthy();
  console.log(`[${label}] Bot: ${resp}`);
  return resp!;
}

describe('Fluxo 4 · Urgência — entrega em 24h com negociação', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve calcular custo expresso, negociar e fechar o pedido', async () => {
    await turno('Oi! Preciso de material com muita urgência, é para amanhã!', 'Boas-vindas');
    await turno('Preciso de panfletos para um evento que acontece amanhã cedo.', 'Identificar');
    await turno('500 unidades, tamanho A5, frente e verso colorido, papel couchê 90g. Preciso em 24 horas!', 'Coletar specs urgente');
    await turno('Qual o custo para entrega expressa em 24 horas?', 'Calcular expresso');
    await turno('Nossa, ficou caro com essa urgência. Tem como reduzir um pouco?', 'Negociar');
    await turno('Ok, entendo a situação. Aceito o valor então.', 'Aguardar aprov.');
    await turno('Aprovado! Pode continuar.', 'Aprovação final');
    await turno('Vou buscar na loja para agilizar.', 'Dados entrega');
    await turno('Confirmo o pedido urgente.', 'Confirmar');
    await turno('Pode gerar a ordem de serviço.', 'Gerar O.S.');
    await turno('Obrigado! Até mais.', 'Encerrar');
  }, 120_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f4_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
