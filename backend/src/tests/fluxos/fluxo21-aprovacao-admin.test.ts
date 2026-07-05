/**
 * Fluxo 21 · Aprovação Admin do orçamento
 *
 * Para rodar este teste, o servidor PRECISA estar com
 * ADMIN_APPROVAL_REQUIRED=true. O test runner também precisa enxergar essa
 * variável — caso contrário o describe é pulado para não falhar localmente.
 *
 * Fluxo coberto:
 *   1. Cliente conversa até VALIDAR_ARQUIVO
 *   2. Confirma arquivo → chain CALCULAR_ORCAMENTO → AGUARDAR_APROVACAO_ADMIN
 *      · sessão pausada, propostaPendente persistida, nenhuma mensagem BOT
 *   3. Cliente manda follow-up → bot responde "Estou revisando..."
 *   4. Admin POST /api/propostas/:sessaoId/aprovar
 *      · FSM resume, manda mensagem do orçamento ao cliente
 *      · estado vira AGUARDAR_APROVACAO
 *   5. Cliente confirma + entrega + confirmação final → GERAR_OS cria OS
 */

import {
  BASE_URL,
  sendMsg,
  cleanupUser,
  uniquePhone,
  wait,
  getSessionState,
  getSessionContext,
  getLastBotResponse,
  getLastOS,
  loginAsGerenteTeste,
  turno as turnoHelper,
} from './helpers';
import { prisma } from '../../config/prisma';

const PHONE = uniquePhone(21);
const NAME = 'Carla Teste F21';

const ADMIN_APPROVAL_ENABLED = process.env.ADMIN_APPROVAL_REQUIRED === 'true';
const describeOrSkip = ADMIN_APPROVAL_ENABLED ? describe : describe.skip;

const turno = (text: string, expectedState: string, label: string, timeoutMs?: number) =>
  turnoHelper(PHONE, NAME, text, expectedState, label, timeoutMs);

async function findSessaoId(phone: string): Promise<string | null> {
  const cliente = await prisma.usuario.findFirst({ where: { telefone: phone } });
  if (!cliente) return null;
  const sessao = await prisma.sessaoAtendimento.findFirst({
    where: { clienteId: cliente.id, ativa: true },
    orderBy: { atualizadoEm: 'desc' },
  });
  return sessao?.id ?? null;
}

describeOrSkip('Fluxo 21 · Aprovação Admin do orçamento', () => {
  beforeAll(async () => {
    await cleanupUser(PHONE);
  });
  afterAll(async () => {
    await cleanupUser(PHONE);
  });

  it('pausa em AGUARDAR_APROVACAO_ADMIN e retoma após admin aprovar', async () => {
    // ── Conversa até VALIDAR_ARQUIVO ────────────────────────────────────────
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

    // ── Confirma arquivo → CALCULAR chain → AGUARDAR_APROVACAO_ADMIN ────────
    // Não usa turnoHelper aqui porque a IA NÃO manda mensagem nova (pausa).
    await sendMsg(PHONE, NAME, 'Sim, tenho o arquivo de arte finalizada em PDF.');

    // Aguarda a transição assíncrona acontecer
    const deadline = Date.now() + 20_000;
    let state: string | null = null;
    while (Date.now() < deadline) {
      await wait(1_500);
      state = await getSessionState(PHONE);
      if (state === 'AGUARDAR_APROVACAO_ADMIN') break;
    }
    expect(state).toBe('AGUARDAR_APROVACAO_ADMIN');

    const ctx = await getSessionContext(PHONE);
    expect(ctx?.propostaPendente).toBeTruthy();
    expect(ctx?.propostaPendente.orcamento.total).toBeGreaterThan(0);

    const osAntes = await getLastOS(PHONE);
    expect(osAntes).toBeNull();

    // ── Cliente manda follow-up → recebe "estou revisando" 1x ────────────────
    await sendMsg(PHONE, NAME, 'E aí, sai logo esse preço?');
    await wait(6_000);
    const followup = await getLastBotResponse(PHONE);
    expect(followup).toMatch(/revisando|instantes/i);

    const ctxAposFollowup = await getSessionContext(PHONE);
    expect(ctxAposFollowup?.aguardandoFollowupEnviado).toBe(true);

    // ── Admin aprova via API ────────────────────────────────────────────────
    const sessaoId = await findSessaoId(PHONE);
    expect(sessaoId).not.toBeNull();

    const gerenteToken = await loginAsGerenteTeste();
    const approveRes = await fetch(`${BASE_URL}/api/propostas/${sessaoId}/aprovar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gerenteToken}`,
      },
    });
    expect(approveRes.ok).toBe(true);
    const approveBody = await approveRes.json();
    expect(approveBody.estadoAtual).toBe('AGUARDAR_APROVACAO');
    expect(approveBody.mensagemEnviada).toMatch(/R\$|orçamento|valor/i);

    // ── Cliente aprova → entrega → confirma → OS criada ─────────────────────
    await turno('Aprovado! Pode continuar.', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprovação');
    await turno('Vou retirar na loja, não preciso de entrega.', 'CONFIRMAR_PEDIDO', 'Dados de entrega');
    await turno('Confirmo o pedido.', 'ENCERRAR', 'Confirmar → Gerar OS', 30_000);

    const os = await getLastOS(PHONE);
    expect(os).not.toBeNull();
    expect(os!.status).toBe('CRIADA');
  }, 180_000);
});
