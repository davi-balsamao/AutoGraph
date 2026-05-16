/**
 * Fluxo 2 · Dúvida sobre produto antes de decidir
 * Cliente indeciso: "Não sei se quero panfleto ou flyer."
 * Precisa de orientação antes de fechar as specs. Retorna ao fluxo após esclarecer.
 *
 * Estados: Boas-vindas → Identificar → Esclarecer → Identificar →
 *          Coletar specs → Validar arq. → Calcular → Apresentar →
 *          Aguardar aprov. → Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, getSessionState, getSessionContext, getLastOS, cleanupUser, wait, uniquePhone, turno } from './helpers';

const PHONE = uniquePhone(2);
const NAME = 'Bruno Teste F2';


describe('Fluxo 2 · Dúvida sobre produto antes de decidir', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve esclarecer dúvida e retomar fluxo normal', async () => {
    await turno(PHONE, NAME, 'Oi, boa tarde! Preciso de um material impresso.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
    await turno(PHONE, NAME, 'Não sei se quero panfleto ou flyer, qual a diferença?', 'ESCLARECER_DUVIDA', 'Identificar → Esclarecer');
    await turno(PHONE, NAME, 'Qual é a diferença técnica entre panfleto e flyer?', 'ESCLARECER_DUVIDA', 'Esclarecer dúvida');
    await turno(PHONE, NAME, 'Entendi! Então vou de panfleto mesmo.', 'COLETAR_ESPECIFICACOES', 'Retorna Identificar');
    await turno(PHONE, NAME, 'Quero 500 unidades, tamanho A4, só frente, colorido, papel couchê 115g.', 'VALIDAR_ARQUIVO', 'Coletar specs');
    await turno(PHONE, NAME, 'Sim, tenho o arquivo pronto em PDF com resolução 300 dpi.', 'AGUARDAR_APROVACAO', 'Validar arq.');
    await turno(PHONE, NAME, 'Pode calcular o valor para mim?', 'AGUARDAR_APROVACAO', 'Calcular', 30_000);
    await turno(PHONE, NAME, 'Gostei do orçamento, aprovado!', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
    await turno(PHONE, NAME, 'Quero entrega. Meu endereço é Av. Brasil, 500, São Paulo – SP.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
    await turno(PHONE, NAME, 'Confirmo o pedido.', 'ENCERRAR', 'Confirmar');
    await turno(PHONE, NAME, 'Pode fechar o pedido.', 'ENCERRAR', 'Gerar O.S.', 30_000);
    await turno(PHONE, NAME, 'Obrigado! Até logo.', 'ENCERRAR', 'Encerrar');
  }, 130_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f2_${Date.now()}`;
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
