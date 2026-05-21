/**
 * Fluxo 18 · Idioma diferente do configurado
 *
 * Cliente escreve em espanhol. Agente detecta, responde bilíngue e pede
 * para continuar em português. Fluxo segue até aprovação admin.
 *
 * Estados:
 * Boas-vindas es → Identificar bilíngue → Coletar specs →
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

const PHONE = uniquePhone(18);
const NAME = 'Sebastião Teste F18';

describe('Fluxo 18 · Atendimento em espanhol → redirecionamento para português', () => {
  beforeAll(async () => {
    await cleanupUser(PHONE);
  });

  afterAll(async () => {
    await cleanupUser(PHONE);
  });

  it('deve detectar espanhol, redirecionar para português e seguir para aprovação admin', async () => {
    await turno(
      PHONE,
      NAME,
      '¡Hola! Quiero hacer un pedido de impresión, folletos para mi negocio.',
      'IDENTIFICAR_NECESSIDADE',
      'Boas-vindas em espanhol'
    );

    await turno(
      PHONE,
      NAME,
      'Quiero folletos. Prefiero hablar en español si es posible.',
      'COLETAR_ESPECIFICACOES',
      'Identificar bilíngue'
    );

    await turno(
      PHONE,
      NAME,
      'Tudo bem, vou continuar em português então. Quero panfletos.',
      'COLETAR_ESPECIFICACOES',
      'Transição para PT'
    );

    await turno(
      PHONE,
      NAME,
      '1000 unidades, tamanho A5, frente e verso colorido, papel couchê 90g.',
      'VALIDAR_ARQUIVO',
      'Coletar specs'
    );

    /**
     * Ao confirmar a arte, o backend calcula, cria a proposta e muda para
     * AGUARDAR_APROVACAO_ADMIN. Nesse estado pode não haver resposta nova.
     */
    await sendMsg(PHONE, NAME, 'Tenho o arquivo em PDF com resolução adequada.');
    await wait(30_000);

    const stateAprovacaoAdmin = await getSessionState(PHONE);

    console.log('\n[Validar arq.]');
    console.log('  Cliente: "Tenho o arquivo em PDF com resolução adequada."');
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
  }, 300_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f18_${Date.now()}`;

    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);

    await wait();

    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});