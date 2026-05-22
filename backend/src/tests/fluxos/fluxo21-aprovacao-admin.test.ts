/**
 * Fluxo 21 · Aprovação Admin do orçamento
 *
 * Para rodar este teste, o servidor PRECISA estar com
 * ADMIN_APPROVAL_REQUIRED=true.
 *
 * Fluxo coberto:
 * 1. Cliente conversa até VALIDAR_ARQUIVO
 * 2. Confirma arquivo → chain CALCULAR_ORCAMENTO → AGUARDAR_APROVACAO_ADMIN
 * 3. O.S. já existe com status AGUARDANDO_ORCAMENTO
 * 4. Cliente manda follow-up → bot responde "Estou revisando..."
 * 5. Admin POST /api/propostas/:sessaoId/aprovar
 * 6. FSM resume, manda orçamento ao cliente e muda para AGUARDAR_APROVACAO
 * 7. Cliente confirma + entrega + confirmação final → O.S. fica CRIADA
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

    await sendMsg(PHONE, NAME, 'Sim, tenho o arquivo de arte finalizada em PDF.');

    const deadline = Date.now() + 30_000;
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
    expect(osAntes).not.toBeNull();
    expect(osAntes!.status).toBe('AGUARDANDO_ORCAMENTO');

    await turno(
      'Pode calcular o orçamento?',
      'AGUARDAR_APROVACAO_ADMIN',
      'Follow-up enquanto aguarda admin',
      30_000
    );

    const followup = await getLastBotResponse(PHONE);
    expect(followup).toMatch(/revisando|instantes/i);

    const ctxAposFollowup = await getSessionContext(PHONE);
    expect(ctxAposFollowup?.aguardandoFollowupEnviado).toBe(true);

    const sessaoId = await findSessaoId(PHONE);
    expect(sessaoId).not.toBeNull();

    const approveRes = await fetch(`${BASE_URL}/api/propostas/${sessaoId}/aprovar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const approveText = await approveRes.text();

    console.log('\n[DEBUG aprovação admin]');
    console.log('  URL:', `${BASE_URL}/api/propostas/${sessaoId}/aprovar`);
    console.log('  Status:', approveRes.status);
    console.log('  Body:', approveText);

    expect(approveRes.ok).toBe(true);

    const approveBody = JSON.parse(approveText);

    expect(approveBody.estadoAtual).toBe('AGUARDAR_APROVACAO');
    expect(approveBody.mensagemEnviada).toMatch(/R\$|orçamento|valor/i);

    await turno('Aprovado! Pode continuar.', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprovação');
    await turno('Vou retirar na loja, não preciso de entrega.', 'CONFIRMAR_PEDIDO', 'Dados de entrega');
    await turno('Confirmo o pedido.', 'ENCERRAR', 'Confirmar → Gerar OS', 30_000);

    const os = await getLastOS(PHONE);

    expect(os).not.toBeNull();
    expect(os!.status).toBe('CRIADA');
  }, 180_000);
});