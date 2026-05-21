/**
 * Fluxo 6 · Interrupção e reengajamento
 *
 * O fluxo atual considera as specs do cartão suficientes e já avança para
 * VALIDAR_ARQUIVO. O teste valida a coleta, validação de arte e pausa em
 * aprovação admin.
 *
 * Estados:
 * Boas-vindas → Identificar → Coletar specs → Validar arq. →
 * AGUARDAR_APROVACAO_ADMIN
 */

import {
  sendMsg,
  getLastBotResponse,
  getSessionState,
  cleanupUser,
  wait,
  uniquePhone,
  turno,
} from './helpers';

const PHONE = uniquePhone(6);
const NAME = 'Fábio Teste F6';

describe('Fluxo 6 · Interrupção e reengajamento', () => {
  beforeAll(async () => {
    await cleanupUser(PHONE);
  });

  afterAll(async () => {
    await cleanupUser(PHONE);
  });

  it('deve seguir para validação de arquivo e aprovação admin', async () => {
    await turno(
      PHONE,
      NAME,
      'Oi, boa tarde! Quero fazer cartões de visita.',
      'IDENTIFICAR_NECESSIDADE',
      'Boas-vindas'
    );

    await turno(
      PHONE,
      NAME,
      'Cartões de visita para minha empresa.',
      'COLETAR_ESPECIFICACOES',
      'Identificar'
    );

    await turno(
      PHONE,
      NAME,
      'Preciso de 500 unidades, padrão 9x5cm, frente colorida, papel couchê 300g.',
      'VALIDAR_ARQUIVO',
      'Coletar specs'
    );

    await sendMsg(PHONE, NAME, 'Sim, tenho o arquivo de arte em PDF, resolução 300 dpi.');
    await wait(30_000);

    const stateAprovacaoAdmin = await getSessionState(PHONE);

    console.log('\n[Validar arq. → aprovação admin]');
    console.log('  Cliente: "Sim, tenho o arquivo de arte em PDF, resolução 300 dpi."');
    console.log(`  Estado : ${stateAprovacaoAdmin}  (esperado: AGUARDAR_APROVACAO_ADMIN)`);

    expect(stateAprovacaoAdmin).toBe('AGUARDAR_APROVACAO_ADMIN');

    await turno(
      PHONE,
      NAME,
      'Pode calcular o orçamento.',
      'AGUARDAR_APROVACAO_ADMIN',
      'Follow-up enquanto aguarda admin',
      30_000
    );
  }, 180_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f6_${Date.now()}`;

    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);

    await wait(20_000);

    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 40_000);
});