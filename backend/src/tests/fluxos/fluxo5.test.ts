/**
 * Fluxo 5 · Pergunta de preço antes das specs
 * "Quanto custa 1000 panfletos?" sem nenhum detalhe técnico.
 * Agente esclarece que precisa das specs antes, coleta tudo e apresenta orçamento.
 *
 * Estados: Boas-vindas → Identificar → Esclarecer preço? →
 *          Coletar specs → Calcular → Apresentar → Aguardar aprov. →
 *          Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, getSessionState, getSessionContext, getLastOS, cleanupUser, wait, uniquePhone, turno } from './helpers';

const PHONE = uniquePhone(5);
const NAME = 'Eduarda Teste F5';


describe('Fluxo 5 · Atalho — pergunta de preço antes das specs', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve esclarecer necessidade de specs antes do preço e fechar o pedido', async () => {
    await turno(PHONE, NAME, 'Oi! Quanto custa 1000 panfletos?', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas + pergunta preço');
    await turno(PHONE, NAME, 'Preciso saber o preço de 1000 panfletos, me diz logo.', 'ESCLARECER_DUVIDA', 'Esclarecer preço');
    await turno(PHONE, NAME, 'Ah, entendi que precisa das especificações. Quero panfletos então.', 'COLETAR_ESPECIFICACOES', 'Identificar');
    await turno(PHONE, NAME, '1000 unidades, tamanho A5, frente e verso colorido, papel couchê 90g.', 'VALIDAR_ARQUIVO', 'Coletar specs');
    await turno(PHONE, NAME, 'Sim, tenho o arquivo em PDF pronto.', 'AGUARDAR_APROVACAO', 'Validar arq.');
    await turno(PHONE, NAME, 'Aprovado! Esse valor está ótimo.', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
    await turno(PHONE, NAME, 'Vou retirar na loja.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
    await turno(PHONE, NAME, 'Confirmo o pedido.', 'ENCERRAR', 'Confirmar');
    await turno(PHONE, NAME, 'Pode fechar.', 'ENCERRAR', 'Gerar O.S.', 30_000);
    await turno(PHONE, NAME, 'Obrigada!', 'ENCERRAR', 'Encerrar');
  }, 300_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f5_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait(20_000); // Espera 20s para garantir que o timeout de 15s do LLM passe antes do cleanup
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 40_000);
});
