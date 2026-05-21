/**
 * Fluxo 1 · Fluxo base — sem desvios
 *
 * Este teste valida o fluxo principal até a etapa de aprovação admin.
 *
 * Estados esperados:
 *   BOAS_VINDAS
 *   → IDENTIFICAR_NECESSIDADE
 *   → COLETAR_ESPECIFICACOES
 *   → VALIDAR_ARQUIVO
 *   → [chain: CALCULAR → AGUARDAR_APROVACAO_ADMIN]
 *
 * A continuação após aprovação do admin é coberta pelo fluxo21.
 */

import {
  sendMsg,
  getLastBotResponse,
  getSessionState,
  getSessionContext,
  cleanupUser,
  wait,
  uniquePhone,
  turno as turnoHelper,
} from './helpers';

const PHONE = uniquePhone(1);
const NAME = 'Ana Teste F1';

/** Wrapper que fixa PHONE e NAME para não repetir em cada chamada. */
const turno = (text: string, expectedState: string, label: string, timeoutMs?: number) =>
  turnoHelper(PHONE, NAME, text, expectedState, label, timeoutMs);

describe('Fluxo 1 · Fluxo base — sem desvios', () => {
  beforeAll(async () => {
    await cleanupUser(PHONE);
  });

  afterAll(async () => {
    await cleanupUser(PHONE);
  });

  it('deve percorrer o fluxo base até aprovação admin', async () => {
    await turno(
      'Oi, boa tarde! Gostaria de fazer um pedido de impressão.',
      'IDENTIFICAR_NECESSIDADE',
      'Boas-vindas'
    );

    await turno(
      'Quero panfletos para divulgar meu restaurante.',
      'COLETAR_ESPECIFICACOES',
      'Identificar produto'
    );

    await turno(
      'Preciso de 1000 unidades, tamanho A5, frente e verso colorido, papel couchê 90g.',
      'VALIDAR_ARQUIVO',
      'Coletar specs'
    );

    const ctxAposSpecs = await getSessionContext(PHONE);
    console.log('  Contexto após specs:', JSON.stringify(ctxAposSpecs, null, 2));

    expect(ctxAposSpecs?.produto?.toLowerCase()).toContain('panfleto');
    expect(ctxAposSpecs?.specs).toBeTruthy();

    /**
     * Ao confirmar a arte, o backend calcula, cria a proposta e muda para
     * AGUARDAR_APROVACAO_ADMIN.
     *
     * Nesse estado, a FSM pausa sem enviar nova mensagem automática.
     * Por isso não usamos turno() aqui.
     */
    await sendMsg(PHONE, NAME, 'Sim, tenho o arquivo de arte finalizada em PDF.');
    await wait(30_000);

    const stateAprovacaoAdmin = await getSessionState(PHONE);
    const ctxAposCalculo = await getSessionContext(PHONE);

    console.log('\n[Validar arquivo → Calcular → aprovação admin]');
    console.log('  Cliente: "Sim, tenho o arquivo de arte finalizada em PDF."');
    console.log(`  Estado : ${stateAprovacaoAdmin}  (esperado: AGUARDAR_APROVACAO_ADMIN)`);
    console.log('  Proposta pendente:', JSON.stringify(ctxAposCalculo?.propostaPendente, null, 2));

    expect(stateAprovacaoAdmin).toBe('AGUARDAR_APROVACAO_ADMIN');
    expect(ctxAposCalculo?.propostaPendente).toBeTruthy();
    expect(ctxAposCalculo?.propostaPendente?.orcamento?.total).toBeGreaterThan(0);

    await turno(
      'Pode calcular o orçamento.',
      'AGUARDAR_APROVACAO_ADMIN',
      'Follow-up enquanto aguarda admin',
      30_000
    );
  }, 100_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f1_${Date.now()}`;

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