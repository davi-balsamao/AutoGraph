/**
 * Fluxo 11 · Múltiplas dúvidas antes de qualquer spec
 * Cliente técnico: quer entender laminação fosca vs brilhosa, gramaturas,
 * sangria. Passa por ESCLARECER_DUVIDAS várias vezes antes de coletar specs.
 *
 * Estados: Boas-vindas → Identificar → Esclarecer → Esclarecer → Esclarecer →
 *          Coletar specs → Validar arq. → Calcular → Apresentar →
 *          Aguardar aprov. → Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, getSessionState, getSessionContext, getLastOS, cleanupUser, wait, uniquePhone, turno } from './helpers';

const PHONE = uniquePhone(11);
const NAME = 'Kleber Teste F11';


describe('Fluxo 11 · Múltiplas dúvidas antes das specs', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve responder múltiplas dúvidas técnicas e retomar coleta de specs', async () => {
    await turno(PHONE, NAME, 'Olá! Tenho bastante dúvida antes de fazer o pedido.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
    await turno(PHONE, NAME, 'Quero cartões de visita, mas preciso entender as opções primeiro.', 'COLETAR_ESPECIFICACOES', 'Identificar');
    await turno(PHONE, NAME, 'Qual é a diferença entre laminação fosca e brilhosa?', 'ESCLARECER_DUVIDA', 'Esclarecer 1 – laminação');
    await turno(PHONE, NAME, 'E sobre gramatura do papel: qual você recomenda para cartão de visita?', 'ESCLARECER_DUVIDA', 'Esclarecer 2 – gramatura');
    await turno(PHONE, NAME, 'O que é sangria no arquivo de arte? Como devo preparar?', 'ESCLARECER_DUVIDA', 'Esclarecer 3 – sangria');
    await turno(PHONE, NAME, 'Entendi tudo! Agora quero cartões de visita com laminação fosca.', 'COLETAR_ESPECIFICACOES', 'Coletar specs');
    await turno(PHONE, NAME, '500 unidades, formato 9x5cm, frente e verso colorido, couchê 300g, laminação fosca.', 'VALIDAR_ARQUIVO', 'Specs completas');
    await turno(PHONE, NAME, 'Tenho o arquivo em PDF com 3mm de sangria e resolução 300 dpi.', 'AGUARDAR_APROVACAO', 'Validar arq.');
    await turno(PHONE, NAME, 'Pode calcular o orçamento.', 'AGUARDAR_APROVACAO', 'Calcular', 30_000);
    await turno(PHONE, NAME, 'Aprovado! Exatamente o que esperava.', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
    await turno(PHONE, NAME, 'Vou retirar na loja.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
    await turno(PHONE, NAME, 'Confirmo o pedido.', 'ENCERRAR', 'Confirmar');
    await turno(PHONE, NAME, 'Pode fechar.', 'ENCERRAR', 'Gerar O.S.', 30_000);
    await turno(PHONE, NAME, 'Muito obrigado! Ficou ótimo.', 'ENCERRAR', 'Encerrar');
  }, 360_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f11_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
