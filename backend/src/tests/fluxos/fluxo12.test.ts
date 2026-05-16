/**
 * Fluxo 12 · Condição financeira influencia decisão
 * Cliente precisa parcelar antes de decidir. Agente informa as opções.
 * Com base nisso, cliente decide avançar com o pedido.
 *
 * Estados: Boas-vindas → Identificar → Esclarecer pag? → Coletar specs →
 *          Calcular → Apresentar → Aguardar aprov. → Dados entrega →
 *          Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, getSessionState, getSessionContext, getLastOS, cleanupUser, wait, uniquePhone, turno } from './helpers';

const PHONE = uniquePhone(12);
const NAME = 'Luana Teste F12';


describe('Fluxo 12 · Dúvida sobre pagamento antes de decidir', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve informar formas de pagamento e fechar o pedido', async () => {
    await turno(PHONE, NAME, 'Oi! Tenho uma dúvida sobre pagamento antes de fazer o pedido.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
    await turno(PHONE, NAME, 'Quero panfletos, mas primeiro preciso saber se posso parcelar.', 'ESCLARECER_DUVIDA', 'Identificar + Esclarecer pag.');
    await turno(PHONE, NAME, 'Vocês aceitam parcelamento no cartão? Em quantas vezes?', 'ESCLARECER_DUVIDA', 'Esclarecer pagamento');
    await turno(PHONE, NAME, 'Ótimo, então posso parcelar. Quero fazer panfletos.', 'VALIDAR_ARQUIVO', 'Coletar specs');
    await turno(PHONE, NAME, '1000 unidades, tamanho A5, frente e verso colorido, papel couchê 90g.', 'VALIDAR_ARQUIVO', 'Specs completas');
    await turno(PHONE, NAME, 'Sim, tenho o arquivo de arte em PDF.', 'AGUARDAR_APROVACAO', 'Validar arq.');
    await turno(PHONE, NAME, 'Pode calcular o orçamento.', 'AGUARDAR_APROVACAO', 'Calcular', 30_000);
    await turno(PHONE, NAME, 'Aprovado! Vou parcelar em 3x.', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
    await turno(PHONE, NAME, 'Entrega no endereço: Rua XV de Novembro, 50, Curitiba – PR.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
    await turno(PHONE, NAME, 'Confirmo o pedido.', 'ENCERRAR', 'Confirmar');
    await turno(PHONE, NAME, 'Pode fechar.', 'ENCERRAR', 'Gerar O.S.', 30_000);
    await turno(PHONE, NAME, 'Obrigada!', 'ENCERRAR', 'Encerrar');
  }, 130_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f12_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
