/**
 * Fluxo 16 · Negociação agressiva → escalada
 *
 * Como agora orçamento passa por aprovação admin, o teste:
 * 1. coleta specs do banner;
 * 2. valida arquivo;
 * 3. pausa em AGUARDAR_APROVACAO_ADMIN;
 * 4. aprova via API;
 * 5. testa negociação agressiva e escalada.
 */

import {
  BASE_URL,
  sendMsg,
  getLastBotResponse,
  getSessionState,
  cleanupUser,
  wait,
  uniquePhone,
  turno,
} from './helpers';
import { prisma } from '../../config/prisma';

const PHONE = uniquePhone(16);
const NAME = 'Patricia Teste F16';

async function findSessaoId(phone: string): Promise<string | null> {
  const cliente = await prisma.usuario.findFirst({ where: { telefone: phone } });
  if (!cliente) return null;

  const sessao = await prisma.sessaoAtendimento.findFirst({
    where: { clienteId: cliente.id, ativa: true },
    orderBy: { atualizadoEm: 'desc' },
  });

  return sessao?.id ?? null;
}

describe('Fluxo 16 · Negociação agressiva → escalada', () => {
  beforeAll(async () => {
    await cleanupUser(PHONE);
  });

  afterAll(async () => {
    await cleanupUser(PHONE);
  });

  it('deve negar desconto excessivo e escalar para humano', async () => {
    await turno(
      PHONE,
      NAME,
      'Oi! Quero fazer banners para minha loja.',
      'IDENTIFICAR_NECESSIDADE',
      'Boas-vindas'
    );

    await turno(
      PHONE,
      NAME,
      'Dois banners grandes para vitrine.',
      'COLETAR_ESPECIFICACOES',
      'Identificar'
    );

    await turno(
      PHONE,
      NAME,
      '2 banners em lona 100x200cm, lona vinílica, acabamento com ilhós e cordão.',
      'VALIDAR_ARQUIVO',
      'Coletar specs'
    );

    await sendMsg(PHONE, NAME, 'Tenho arte em PDF, resolução 300 dpi.');
    await wait(30_000);

    const stateAprovacaoAdmin = await getSessionState(PHONE);

    console.log('\n[Validar arq. → aprovação admin]');
    console.log('  Cliente: "Tenho arte em PDF, resolução 300 dpi."');
    console.log(`  Estado : ${stateAprovacaoAdmin}  (esperado: AGUARDAR_APROVACAO_ADMIN)`);

    expect(stateAprovacaoAdmin).toBe('AGUARDAR_APROVACAO_ADMIN');

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
expect(approveBody.mensagemEnviada).not.toMatch(/1\.800\.000|1800000/);
expect(approveBody.mensagemEnviada).toMatch(/R\$/);

    await wait(5_000);
    expect(await getSessionState(PHONE)).toBe('AGUARDAR_APROVACAO');

    await turno(
      PHONE,
      NAME,
      'Achei um pouco caro. Consegue um desconto de 5%?',
      'NEGOCIAR',
      'Negociar dentro da margem',
      30_000
    );

    await turno(
      PHONE,
      NAME,
      'Não posso pagar tudo isso, preciso de 40% de desconto ou não fecho.',
      'ESCALAR_HUMANO',
      'Insistência acima da margem',
      30_000
    );

    await sendMsg(PHONE, NAME, 'Então quero falar com um gerente! Isso é abuso de preço!');
    await wait(10_000);

    const stateEscalado = await getSessionState(PHONE);
    expect(stateEscalado).toBe('ESCALAR_HUMANO');
  }, 180_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f16_${Date.now()}`;

    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);

    await wait();

    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});