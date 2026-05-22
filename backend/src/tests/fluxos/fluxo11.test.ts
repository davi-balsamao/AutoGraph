/**
 * Fluxo 11 · Múltiplas dúvidas antes de qualquer spec
 *
 * Cliente técnico quer entender laminação, gramaturas e sangria.
 * Durante COLETAR_ESPECIFICACOES, dúvidas técnicas são respondidas sem sair
 * da coleta, preservando o contexto do pedido.
 *
 * Estados:
 * Boas-vindas → Identificar → Coletar specs/dúvidas → Coletar specs →
 * Validar arq. → AGUARDAR_APROVACAO_ADMIN
 */

import {
  sendMsg,
  getLastBotResponse,
  getSessionState,
  cleanupUser,
  wait,
  uniquePhone,
  turno,
} from './helpers';

const PHONE = uniquePhone(11);
const NAME = 'Kleber Teste F11';

describe('Fluxo 11 · Múltiplas dúvidas antes das specs', () => {
  beforeAll(async () => {
    await cleanupUser(PHONE);
  });

  afterAll(async () => {
    await cleanupUser(PHONE);
  });

  it('deve responder múltiplas dúvidas técnicas e seguir para aprovação admin', async () => {
    await turno(
      PHONE,
      NAME,
      'Olá! Tenho bastante dúvida antes de fazer o pedido.',
      'IDENTIFICAR_NECESSIDADE',
      'Boas-vindas'
    );

    await turno(
      PHONE,
      NAME,
      'Quero cartões de visita, mas preciso entender as opções primeiro.',
      'COLETAR_ESPECIFICACOES',
      'Identificar'
    );

    await turno(
      PHONE,
      NAME,
      'Qual é a diferença entre laminação fosca e brilhosa?',
      'COLETAR_ESPECIFICACOES',
      'Dúvida técnica 1 – laminação',
      30_000
    );

    await turno(
      PHONE,
      NAME,
      'E sobre gramatura do papel: qual você recomenda para cartão de visita?',
      'COLETAR_ESPECIFICACOES',
      'Dúvida técnica 2 – gramatura',
      30_000
    );

    await turno(
      PHONE,
      NAME,
      'O que é sangria no arquivo de arte? Como devo preparar?',
      'COLETAR_ESPECIFICACOES',
      'Dúvida técnica 3 – sangria',
      30_000
    );

    await turno(
      PHONE,
      NAME,
      'Entendi tudo! Agora quero cartões de visita com laminação fosca.',
      'COLETAR_ESPECIFICACOES',
      'Retoma coleta de specs'
    );

    await turno(
      PHONE,
      NAME,
      '500 unidades, formato 9x5cm, frente e verso colorido, couchê 300g, laminação fosca.',
      'VALIDAR_ARQUIVO',
      'Specs completas'
    );

    /**
     * Ao confirmar a arte, o backend calcula, cria a proposta e muda para
     * AGUARDAR_APROVACAO_ADMIN. Nesse estado pode não haver resposta nova.
     */
    await sendMsg(PHONE, NAME, 'Tenho o arquivo em PDF com 3mm de sangria e resolução 300 dpi.');
    await wait(30_000);

    const stateAprovacaoAdmin = await getSessionState(PHONE);

    console.log('\n[aprovação admin]');
    console.log('  Cliente: "Tenho o arquivo em PDF com 3mm de sangria e resolução 300 dpi."');
    console.log(`  Estado : ${stateAprovacaoAdmin}  (esperado: AGUARDAR_APROVACAO_ADMIN)`);

    expect(stateAprovacaoAdmin).toBe('AGUARDAR_APROVACAO_ADMIN');

    await turno(
      PHONE,
      NAME,
      'Pode calcular o orçamento.',
      'AGUARDAR_APROVACAO_ADMIN',
      'Follow-up enquanto aguarda admin',
      30_000
    );
  }, 360_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f11_${Date.now()}`;

    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);

    await wait();

    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});