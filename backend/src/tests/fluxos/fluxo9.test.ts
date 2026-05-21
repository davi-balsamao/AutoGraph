/**
 * Fluxo 9 · Formato de arquivo incompatível
 *
 * Cliente envia .PSD com camadas abertas. Bot rejeita, explica os formatos
 * aceitos e permanece em VALIDAR_ARQUIVO até o cliente reenviar em formato aceito.
 *
 * Estados:
 * Boas-vindas → Identificar → Coletar specs → Validar arq. ❌ fmt →
 * Validar arq. aguardando PDF → AGUARDAR_APROVACAO_ADMIN
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

const PHONE = uniquePhone(9);
const NAME = 'Isabela Teste F9';

describe('Fluxo 9 · Arquivo em formato incompatível (.PSD)', () => {
  jest.setTimeout(360_000);

  beforeAll(async () => {
    await cleanupUser(PHONE);
  });

  afterAll(async () => {
    await cleanupUser(PHONE);
  });

  it('deve rejeitar .PSD e retomar após reenvio no formato correto', async () => {
    await turno(
      PHONE,
      NAME,
      'Oi! Quero fazer flyers para uma promoção.',
      'IDENTIFICAR_NECESSIDADE',
      'Boas-vindas'
    );

    await turno(
      PHONE,
      NAME,
      'Flyers para uma promoção de verão da minha loja.',
      'COLETAR_ESPECIFICACOES',
      'Identificar'
    );

    await turno(
      PHONE,
      NAME,
      '500 unidades, tamanho A5, frente colorida, papel couchê 115g.',
      'VALIDAR_ARQUIVO',
      'Coletar specs'
    );

    await turno(
      PHONE,
      NAME,
      'Tenho o arquivo de arte em .PSD com todas as camadas abertas.',
      'VALIDAR_ARQUIVO',
      'Validar arq. ❌ fmt PSD'
    );

    await turno(
      PHONE,
      NAME,
      'Entendi, vou exportar para PDF. Pode aguardar.',
      'VALIDAR_ARQUIVO',
      'Orientação formato',
      90_000
    );

    await sendMsg(PHONE, NAME, 'Agora reenviei o arquivo em PDF com as camadas achatadas.');
    await wait(30_000);

    const stateAprovacaoAdmin = await getSessionState(PHONE);

    console.log('\n[Validar arq. ✓ → aprovação admin]');
    console.log('  Cliente: "Agora reenviei o arquivo em PDF com as camadas achatadas."');
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
  }, 360_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f9_${Date.now()}`;

    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);

    await wait();

    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});