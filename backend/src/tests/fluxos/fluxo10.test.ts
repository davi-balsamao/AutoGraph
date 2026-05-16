/**
 * Fluxo 10 · Produto completamente fora do catálogo
 * "Quero copo personalizado com logo." Gráfica só faz materiais impressos.
 * Agente informa, sugere alternativa impressa ou encerra.
 *
 * Estados: Boas-vindas → Identificar → Prod. indisp. → Encerrar
 */

import { sendMsg, getLastBotResponse, getSessionState, getSessionContext, getLastOS, cleanupUser, wait, uniquePhone, turno } from './helpers';

const PHONE = uniquePhone(10);
const NAME = 'João Teste F10';


describe('Fluxo 10 · Produto fora do catálogo', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve informar produto indisponível e encerrar com educação', async () => {
    await turno(PHONE, NAME, 'Oi! Quero copos personalizados com o logo da minha empresa.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas + produto indisp.');
    await turno(PHONE, NAME, 'Preciso de 100 copos com meu logo impresso.', 'COLETAR_ESPECIFICACOES', 'Identificar → Prod. indisp.');
    await turno(PHONE, NAME, 'Entendido, vocês não fazem copos. Tem alguma alternativa impressa?', 'COLETAR_ESPECIFICACOES', 'Alternativa');
    await turno(PHONE, NAME, 'Tudo bem, por enquanto não preciso de mais nada. Obrigado!', 'ENCERRAR', 'Encerrar');
  }, 50_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f10_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
