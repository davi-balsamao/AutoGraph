/**
 * Fluxo 8 · Ciclo completo sem conversão
 * Cliente pede orçamento para comparar preços. Recebe, agradece e diz
 * "vou pensar". Agente encerra sem insistir ou forçar pedido.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Calcular →
 *          Apresentar → Aguardar aprov. recusa → Encerrar
 */

import { sendMsg, getLastBotResponse, getSessionState, getSessionContext, getLastOS, cleanupUser, wait, uniquePhone, turno } from './helpers';

const PHONE = uniquePhone(8);
const NAME = 'Henrique Teste F8';


describe('Fluxo 8 · Orçamento sem conversão', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve fornecer orçamento e encerrar sem insistir após recusa', async () => {
    await turno(PHONE, NAME, 'Oi! Quero apenas um orçamento para comparar preços.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
    await turno(PHONE, NAME, 'Panfletos para minha loja.', 'COLETAR_ESPECIFICACOES', 'Identificar');
    await turno(PHONE, NAME, '1000 unidades, tamanho A5, frente e verso colorido, couchê 90g.', 'VALIDAR_ARQUIVO', 'Coletar specs');
    await turno(PHONE, NAME, 'Pode calcular o preço para mim.', 'AGUARDAR_APROVACAO', 'Calcular', 30_000);
    await turno(PHONE, NAME, 'Obrigado pelo orçamento, vou pensar e talvez retorne mais tarde.', 'ENCERRAR', 'Recusa/Aguardar');
    await turno(PHONE, NAME, 'Por enquanto não vou fechar, até mais!', 'ENCERRAR', 'Encerrar');
  }, 70_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f8_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
