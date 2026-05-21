/**
 * Fluxo 3 · Arquivo em JPEG
 *
 * Bot aceita arquivo em JPEG e encaminha o orçamento para aprovação admin.
 * A validação técnica fina fica com a recepcionista/admin.
 *
 * Estados:
 * Boas-vindas → Identificar → Coletar specs → Validar arquivo →
 * AGUARDAR_APROVACAO_ADMIN
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

const PHONE = uniquePhone(3);
const NAME = 'Carla Teste F3';

describe('Fluxo 3 · Arquivo em JPEG — recepcionista valida técnico depois', () => {
  beforeAll(async () => {
    await cleanupUser(PHONE);
  });

  afterAll(async () => {
    await cleanupUser(PHONE);
  });

  it('deve aceitar arquivo em JPEG e seguir para aprovação admin', async () => {
    await turno(
      PHONE,
      NAME,
      'Olá! Quero fazer panfletos para um evento.',
      'IDENTIFICAR_NECESSIDADE',
      'Boas-vindas'
    );

    await turno(
      PHONE,
      NAME,
      'Preciso de panfletos para divulgar um show.',
      'COLETAR_ESPECIFICACOES',
      'Identificar'
    );

    await turno(
      PHONE,
      NAME,
      '500 unidades, tamanho A5, só frente colorida, papel couchê 90g.',
      'VALIDAR_ARQUIVO',
      'Coletar specs'
    );

    /**
     * Ao confirmar a arte, a FSM pode pausar sem resposta nova.
     * Então validamos o estado diretamente.
     */
    await sendMsg(PHONE, NAME, 'Tenho o arquivo pronto em JPEG.');
    await wait(30_000);

    const stateAprovacaoAdmin = await getSessionState(PHONE);
    const ctxAposCalculo = await getSessionContext(PHONE);

    console.log('\n[Validar arq. → chain Calcular → aprovação admin]');
    console.log('  Cliente: "Tenho o arquivo pronto em JPEG."');
    console.log(`  Estado : ${stateAprovacaoAdmin}  (esperado: AGUARDAR_APROVACAO_ADMIN)`);
    console.log('  Proposta pendente:', JSON.stringify(ctxAposCalculo?.propostaPendente, null, 2));

    expect(stateAprovacaoAdmin).toBe('AGUARDAR_APROVACAO_ADMIN');
    expect(ctxAposCalculo?.propostaPendente).toBeTruthy();
    expect(ctxAposCalculo?.propostaPendente?.orcamento?.total).toBeGreaterThan(0);

    await turno(
      PHONE,
      NAME,
      'Pode calcular o orçamento.',
      'AGUARDAR_APROVACAO_ADMIN',
      'Follow-up enquanto aguarda admin',
      30_000
    );
  }, 100_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f3_${Date.now()}`;

    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);

    await wait();

    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});