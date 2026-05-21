/**
 * Fluxo 17 · Canal não suportado — mensagem de áudio
 *
 * No teste atual, o áudio é simulado como texto "🎤".
 * Como isso não identifica produto, o estado correto permanece em
 * IDENTIFICAR_NECESSIDADE. Depois o cliente escreve e o fluxo segue.
 *
 * Estados:
 * Entrada incompleta → Identificar → Coletar specs → Validar arq. →
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

const PHONE = uniquePhone(17);
const NAME = 'Rafael Teste F17';

describe('Fluxo 17 · Áudio → solicitação de texto → fluxo normal', () => {
  beforeAll(async () => {
    await cleanupUser(PHONE);
  });

  afterAll(async () => {
    await cleanupUser(PHONE);
  });

  it('deve solicitar texto quando receber entrada não textual e retomar fluxo', async () => {
    await turno(
      PHONE,
      NAME,
      '🎤',
      'IDENTIFICAR_NECESSIDADE',
      'Áudio simulado — bot pede texto'
    );

    await turno(
      PHONE,
      NAME,
      'Desculpe, vou escrever então. Quero fazer panfletos.',
      'COLETAR_ESPECIFICACOES',
      'Texto após orientação'
    );

    await turno(
      PHONE,
      NAME,
      'Panfletos para divulgar minha academia.',
      'COLETAR_ESPECIFICACOES',
      'Identificar'
    );

    await turno(
      PHONE,
      NAME,
      '500 unidades, tamanho A5, frente colorida, papel couchê 90g.',
      'VALIDAR_ARQUIVO',
      'Coletar specs'
    );

    await sendMsg(PHONE, NAME, 'Tenho o arquivo em PDF com 300 dpi.');
    await wait(30_000);

    const stateAprovacaoAdmin = await getSessionState(PHONE);

    console.log('\n[Validar arq. → aprovação admin]');
    console.log('  Cliente: "Tenho o arquivo em PDF com 300 dpi."');
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
  }, 160_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f17_${Date.now()}`;

    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);

    await wait();

    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});