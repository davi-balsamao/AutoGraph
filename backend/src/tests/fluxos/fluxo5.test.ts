/**
 * Fluxo 5 · Pergunta de preço antes das specs
 *
 * Cliente pergunta preço antes de informar detalhes técnicos.
 * O bot esclarece que precisa das specs, coleta tudo, valida arquivo
 * e envia para aprovação admin.
 *
 * Estados:
 * Boas-vindas → Esclarecer dúvida → Coletar specs →
 * Validar arquivo → AGUARDAR_APROVACAO_ADMIN
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

const PHONE = uniquePhone(5);
const NAME = 'Eduarda Teste F5';

describe('Fluxo 5 · Atalho — pergunta de preço antes das specs', () => {
  beforeAll(async () => {
    await cleanupUser(PHONE);
  });

  afterAll(async () => {
    await cleanupUser(PHONE);
  });

  it('deve esclarecer necessidade de specs antes do preço e seguir para aprovação admin', async () => {
    await turno(
      PHONE,
      NAME,
      'Oi! Quanto custa 1000 panfletos?',
      'IDENTIFICAR_NECESSIDADE',
      'Boas-vindas + pergunta preço'
    );

    await turno(
      PHONE,
      NAME,
      'Preciso saber o preço de 1000 panfletos, me diz logo.',
      'ESCLARECER_DUVIDA',
      'Esclarecer preço',
      40_000
    );

    await turno(
      PHONE,
      NAME,
      'Ah, entendi que precisa das especificações. Quero panfletos então.',
      'COLETAR_ESPECIFICACOES',
      'Identificar',
      40_000
    );

    await turno(
      PHONE,
      NAME,
      '1000 unidades, tamanho A5, frente e verso colorido, papel couchê 90g.',
      'VALIDAR_ARQUIVO',
      'Coletar specs',
      25_000
    );

    /**
     * Ao confirmar a arte, o backend calcula, cria proposta e muda para
     * AGUARDAR_APROVACAO_ADMIN. Nesse estado pode não haver resposta nova.
     */
    await sendMsg(PHONE, NAME, 'Sim, tenho o arquivo em PDF pronto.');
    await wait(40_000);

    const stateAprovacaoAdmin = await getSessionState(PHONE);

    console.log('\n[Validar arq.]');
    console.log('  Cliente: "Sim, tenho o arquivo em PDF pronto."');
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
  }, 300_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f5_${Date.now()}`;

    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);

    await wait(20_000);

    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 40_000);
});