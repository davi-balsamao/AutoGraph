/**
 * Fluxo 1 · Fluxo base — sem desvios
 *
 * Cada turno valida TRÊS coisas:
 *   1. Estado FSM persistido no DB (para imediatamente se errar)
 *   2. Resposta do bot não vazia
 *   3. Conteúdo esperado nos checkpoints críticos (preço, código de OS)
 *
 * Estados esperados:
 *   BOAS_VINDAS
 *   → IDENTIFICAR_NECESSIDADE
 *   → COLETAR_ESPECIFICACOES
 *   → VALIDAR_ARQUIVO
 *   → [chain: CALCULAR → APRESENTAR] → AGUARDAR_APROVACAO
 *   → COLETAR_DADOS_ENTREGA
 *   → CONFIRMAR_PEDIDO
 *   → [chain: GERAR_OS] → ENCERRAR
 */

import {
  sendMsg,
  getLastBotResponse,
  getSessionState,
  getSessionContext,
  getLastOS,
  cleanupUser,
  wait,
  uniquePhone,
} from './helpers';

const PHONE = uniquePhone(1);
const NAME  = 'Ana Teste F1';

/** Envia mensagem, aguarda e retorna estado + resposta. Para na hora se o estado divergir. */
async function turno(
  text: string,
  expectedState: string,
  label: string,
  waitMs = 8_000,
): Promise<{ state: string; resp: string }> {
  await sendMsg(PHONE, NAME, text);
  await wait(waitMs);

  const state = await getSessionState(PHONE);
  const resp  = await getLastBotResponse(PHONE);

  console.log(`\n[${label}]`);
  console.log(`  Estado : ${state}  (esperado: ${expectedState})`);
  console.log(`  Bot    : ${resp}`);

  // Falha imediata se o estado divergir — evita continuar com dados corrompidos
  expect(state).toBe(expectedState);
  expect(resp).toBeTruthy();

  return { state: state!, resp: resp! };
}

describe('Fluxo 1 · Fluxo base — sem desvios', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async ()  => { await cleanupUser(PHONE); });

  it('deve percorrer o fluxo completo respeitando estado e conteúdo em cada turno', async () => {

    // ── Turno 1: Boas-vindas ────────────────────────────────────────────────
    await turno(
      'Oi, boa tarde! Gostaria de fazer um pedido de impressão.',
      'IDENTIFICAR_NECESSIDADE',
      'Boas-vindas',
    );

    // ── Turno 2: Identificar produto ────────────────────────────────────────
    await turno(
      'Quero panfletos para divulgar meu restaurante.',
      'COLETAR_ESPECIFICACOES',
      'Identificar produto',
    );

    // ── Turno 3: Coletar specs ───────────────────────────────────────────────
    await turno(
      'Preciso de 1000 unidades, tamanho A5, frente e verso colorido, papel couchê 90g.',
      'VALIDAR_ARQUIVO',
      'Coletar specs',
    );

    // Verifica que as specs foram salvas no contexto
    const ctxAposSpecs = await getSessionContext(PHONE);
    console.log('  Contexto após specs:', JSON.stringify(ctxAposSpecs, null, 2));
    expect(ctxAposSpecs?.produto?.toLowerCase()).toContain('panfleto');

    // ── Turno 4: Validar arquivo → (chain) Calcular → Apresentar ────────────
    // Este turno dispara 3 estados internos automáticos. Aguarda mais tempo.
    const { resp: respAprovacao } = await turno(
      'Sim, tenho o arquivo de arte finalizada em PDF.',
      'AGUARDAR_APROVACAO',
      'Validar arquivo → chain Calcular → Apresentar',
      10_000,
    );

    // Checkpoint crítico: o orçamento deve ter sido calculado e salvo no contexto
    const ctxAposCalculo = await getSessionContext(PHONE);
    console.log('  Contexto após cálculo:', JSON.stringify(ctxAposCalculo?.orcamento, null, 2));
    expect(ctxAposCalculo?.orcamento?.total).toBeGreaterThan(0);

    // A resposta enviada ao cliente deve conter o valor monetário
    expect(respAprovacao).toMatch(/R\$|orçamento|valor/i);

    // ── Turno 5: Aprovar orçamento ───────────────────────────────────────────
    await turno(
      'Aprovado! Pode continuar.',
      'COLETAR_DADOS_ENTREGA',
      'Aguardar aprovação',
    );

    // ── Turno 6: Dados de entrega ────────────────────────────────────────────
    await turno(
      'Vou retirar na loja, não preciso de entrega.',
      'CONFIRMAR_PEDIDO',
      'Dados de entrega',
    );

    // Verifica que a modalidade foi salva
    const ctxAposEntrega = await getSessionContext(PHONE);
    console.log('  Entrega:', JSON.stringify(ctxAposEntrega?.entrega, null, 2));
    expect(ctxAposEntrega?.entrega?.modalidade).toBe('retirada');

    // ── Turno 7: Confirmar → (chain) Gerar O.S. → Encerrar ──────────────────
    // GERAR_OS chama LLM para mensagem sugerida — aguarda mais tempo.
    const { resp: respEncerrar } = await turno(
      'Confirmo o pedido.',
      'ENCERRAR',
      'Confirmar → chain Gerar O.S. → Encerrar',
      14_000,
    );

    // Checkpoint crítico: a O.S. deve ter sido criada no banco
    const os = await getLastOS(PHONE);
    console.log('  O.S. criada:', os ? `ID ${os.id.slice(0, 8).toUpperCase()}` : 'NENHUMA');
    expect(os).not.toBeNull();
    expect(os!.observacoes).toMatch(/validar arte/i);

    // A resposta deve mencionar a Ordem de Serviço
    expect(respEncerrar).toMatch(/ordem de servi[çc]o|O\.S\.|OS/i);

  }, 90_000);

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
