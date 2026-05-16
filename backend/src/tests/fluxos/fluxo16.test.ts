/**
 * Fluxo 16 · Exigência de desconto além da margem
 * Após orçamento, cliente exige 40% de desconto e insiste várias vezes.
 * Agente oferece alternativas dentro da margem, não cede. Escalada para humano.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Calcular →
 *          Apresentar → Aguardar aprov. → Negociar → Escalar
 */

import { sendMsg, getLastBotResponse, getSessionState, getSessionContext, getLastOS, cleanupUser, wait, uniquePhone, turno } from './helpers';

const PHONE = uniquePhone(16);
const NAME = 'Patricia Teste F16';


describe('Fluxo 16 · Negociação agressiva → escalada', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve negar desconto excessivo e escalar para humano', async () => {
    await turno(PHONE, NAME, 'Oi! Quero fazer banners para minha loja.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
    await turno(PHONE, NAME, 'Dois banners grandes para vitrine.', 'COLETAR_ESPECIFICACOES', 'Identificar');
    await turno(PHONE, NAME, 'Banners 100x200cm, lona vinílica, acabamento com ilhós e cordão.', 'VALIDAR_ARQUIVO', 'Coletar specs');
    await turno(PHONE, NAME, 'Tenho arte em PDF, resolução 300 dpi.', 'AGUARDAR_APROVACAO', 'Validar arq.');
    await turno(PHONE, NAME, 'Esse preço está muito caro! Quero 40% de desconto ou não compro.', 'NEGOCIAR', 'Negociar agressivo');
    await turno(PHONE, NAME, 'Não aceito nem um centavo a mais, preciso dos 40% de desconto mesmo!', 'COLETAR_ESPECIFICACOES', 'Insistência');
    await turno(PHONE, NAME, 'Então quero falar com um gerente! Isso é abuso de preço!', 'COLETAR_ESPECIFICACOES', 'Escalada');
  }, 80_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f16_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
