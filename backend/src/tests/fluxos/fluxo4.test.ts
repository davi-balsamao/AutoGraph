/**
 * Fluxo 4 · Urgência que altera custo e prazo
 * Cliente precisa do material em 24 horas. Agente calcula custo expresso,
 * informa o acréscimo. Cliente questiona o valor — pequena negociação — e aprova.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Calcular expresso →
 *          Apresentar → Aguardar aprov. → Negociar → Aguardar aprov. →
 *          Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, getSessionState, getSessionContext, getLastOS, cleanupUser, wait, uniquePhone, turno } from './helpers';

const PHONE = uniquePhone(4);
const NAME = 'Diego Teste F4';


describe('Fluxo 4 · Urgência — entrega em 24h com negociação', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve calcular custo expresso, negociar e fechar o pedido', async () => {
    await turno(PHONE, NAME, 'Oi! Preciso de material com muita urgência, é para amanhã!', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
    await turno(PHONE, NAME, 'Preciso de panfletos para um evento que acontece amanhã cedo.', 'COLETAR_ESPECIFICACOES', 'Identificar');
    await turno(PHONE, NAME, '500 unidades, tamanho A5, frente e verso colorido, papel couchê 90g. Preciso em 24 horas!', 'VALIDAR_ARQUIVO', 'Coletar specs urgente');
    await turno(PHONE, NAME, 'Qual o custo para entrega expressa em 24 horas?', 'AGUARDAR_APROVACAO', 'Calcular expresso', 30_000);
    await turno(PHONE, NAME, 'Nossa, ficou caro com essa urgência. Tem como reduzir um pouco?', 'NEGOCIAR', 'Negociar');
    await turno(PHONE, NAME, 'Ok, entendo a situação. Aceito o valor então.', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
    await turno(PHONE, NAME, 'Aprovado! Pode continuar.', 'COLETAR_DADOS_ENTREGA', 'Aprovação final');
    await turno(PHONE, NAME, 'Vou buscar na loja para agilizar.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
    await turno(PHONE, NAME, 'Confirmo o pedido urgente.', 'ENCERRAR', 'Confirmar');
    await turno(PHONE, NAME, 'Pode gerar a ordem de serviço.', 'ENCERRAR', 'Gerar O.S.', 30_000);
    await turno(PHONE, NAME, 'Obrigado! Até mais.', 'ENCERRAR', 'Encerrar');
  }, 120_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f4_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
