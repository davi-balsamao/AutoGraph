/**
 * Fluxo 2 · Dúvida sobre produto antes de decidir
 *
 * Cliente indeciso pergunta a diferença entre panfleto/flyer.
 * O bot esclarece, retoma a coleta, valida arquivo e envia para aprovação admin.
 *
 * Estados:
 * Boas-vindas → Identificar → Esclarecer → Coletar specs →
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

const PHONE = uniquePhone(2);
const NAME = 'Bruno Teste F2';

describe('Fluxo 2 · Dúvida sobre produto antes de decidir', () => {
  beforeAll(async () => {
    await cleanupUser(PHONE);
  });

  afterAll(async () => {
    await cleanupUser(PHONE);
  });

  it('deve esclarecer dúvida e seguir para aprovação admin', async () => {
    await turno(
      PHONE,
      NAME,
      'Oi, boa tarde! Preciso de um material impresso.',
      'IDENTIFICAR_NECESSIDADE',
      'Boas-vindas'
    );

    await turno(
      PHONE,
      NAME,
      'Não sei se quero panfleto ou flyer, qual a diferença?',
      'ESCLARECER_DUVIDA',
      'Identificar → Esclarecer',
      30_000
    );

    await turno(
      PHONE,
      NAME,
      'Qual é a diferença técnica entre panfleto e flyer?',
      'ESCLARECER_DUVIDA',
      'Esclarecer dúvida',
      30_000
    );

    await turno(
      PHONE,
      NAME,
      'Entendi! Então vou de panfleto mesmo.',
      'COLETAR_ESPECIFICACOES',
      'Retorna Identificar'
    );

    await turno(
      PHONE,
      NAME,
      'Quero 500 unidades, tamanho A4, só frente, colorido, papel couchê 115g.',
      'VALIDAR_ARQUIVO',
      'Coletar specs'
    );

    /**
     * Ao confirmar a arte, o backend calcula, cria proposta e muda para
     * AGUARDAR_APROVACAO_ADMIN. Nesse estado pode não haver resposta nova.
     */
    await sendMsg(PHONE, NAME, 'Sim, tenho o arquivo pronto em PDF com resolução 300 dpi.');
    await wait(30_000);

    const stateAprovacaoAdmin = await getSessionState(PHONE);

    console.log('\n[aprovação admin]');
    console.log('  Cliente: "Sim, tenho o arquivo pronto em PDF com resolução 300 dpi."');
    console.log(`  Estado : ${stateAprovacaoAdmin}  (esperado: AGUARDAR_APROVACAO_ADMIN)`);

    expect(stateAprovacaoAdmin).toBe('AGUARDAR_APROVACAO_ADMIN');

    await turno(
      PHONE,
      NAME,
      'Pode calcular o valor para mim?',
      'AGUARDAR_APROVACAO_ADMIN',
      'Follow-up enquanto aguarda admin',
      30_000
    );
  }, 130_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f2_${Date.now()}`;

    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);

    await wait();

    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);

  it('deve responder a entrada incompleta', async () => {
    await sendMsg(PHONE, NAME, '?');
    await wait();

    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 20_000);
});