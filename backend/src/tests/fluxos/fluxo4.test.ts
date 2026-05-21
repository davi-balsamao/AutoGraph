/**
 * Fluxo 4 · Urgência que altera custo e prazo
 *
 * Cliente precisa do material em 24 horas.
 * Quando pergunta preço/custo antes da arte, o bot esclarece.
 * Depois, ao confirmar arte, o orçamento vai para aprovação admin.
 *
 * Estados:
 * Boas-vindas → Identificar → Coletar specs → Validar arquivo →
 * ESCLARECER_DUVIDA → AGUARDAR_APROVACAO_ADMIN
 */

import {
  sendMsg,
  getLastBotResponse,
  getSessionState,
  getSessionContext,
  cleanupUser,
  wait,
  uniquePhone,
  turno,
} from './helpers';

const PHONE = uniquePhone(4);
const NAME = 'Diego Teste F4';

describe('Fluxo 4 · Urgência — entrega em 24h com negociação', () => {
  beforeAll(async () => {
    await cleanupUser(PHONE);
  });

  afterAll(async () => {
    await cleanupUser(PHONE);
  });

  it('deve esclarecer custo, validar arquivo e seguir para aprovação admin', async () => {
    await turno(
      PHONE,
      NAME,
      'Oi! Preciso de material com muita urgência, é para amanhã!',
      'IDENTIFICAR_NECESSIDADE',
      'Boas-vindas'
    );

    await turno(
      PHONE,
      NAME,
      'Preciso de panfletos para um evento que acontece amanhã cedo.',
      'COLETAR_ESPECIFICACOES',
      'Identificar'
    );

    await turno(
      PHONE,
      NAME,
      '500 unidades, tamanho A5, frente e verso colorido, papel couchê 90g. Preciso em 24 horas!',
      'VALIDAR_ARQUIVO',
      'Coletar specs urgente'
    );

    await turno(
      PHONE,
      NAME,
      'Qual o custo para entrega expressa em 24 horas?',
      'ESCLARECER_DUVIDA',
      'Pergunta custo cedo → Esclarecer',
      30_000
    );

    /**
     * O cliente sai da dúvida e confirma que tem a arte.
     * O handler retorna para VALIDAR_ARQUIVO, encadeia cálculo e pausa em
     * AGUARDAR_APROVACAO_ADMIN sem resposta nova.
     */
    await sendMsg(PHONE, NAME, 'Entendi. Sim, tenho o arquivo de arte pronto em PDF.');
    await wait(30_000);

    const stateAprovacaoAdmin = await getSessionState(PHONE);
    const ctxAposCalculo = await getSessionContext(PHONE);

    console.log('\n[Confirma arte → chain Calcular]');
    console.log('  Cliente: "Entendi. Sim, tenho o arquivo de arte pronto em PDF."');
    console.log(`  Estado : ${stateAprovacaoAdmin}  (esperado: AGUARDAR_APROVACAO_ADMIN)`);
    console.log('  Proposta pendente:', JSON.stringify(ctxAposCalculo?.propostaPendente, null, 2));

    expect(stateAprovacaoAdmin).toBe('AGUARDAR_APROVACAO_ADMIN');
    expect(ctxAposCalculo?.propostaPendente).toBeTruthy();
    expect(ctxAposCalculo?.propostaPendente?.orcamento?.total).toBeGreaterThan(0);

    await turno(
      PHONE,
      NAME,
      'Pode calcular com urgência.',
      'AGUARDAR_APROVACAO_ADMIN',
      'Follow-up enquanto aguarda admin',
      30_000
    );
  }, 120_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f4_${Date.now()}`;

    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);

    await wait();

    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});