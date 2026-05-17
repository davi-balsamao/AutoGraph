/**
 * Fluxo 3 · Arquivo em JPEG (validação técnica fica com a recepcionista)
 *
 * Realinhado ao contrato do validar-arquivo.md (Fase 5):
 *   - Bot NÃO valida DPI/resolução/sangria — isso é responsabilidade da recepcionista
 *     no momento da revisão da O.S.
 *   - Cliente diz que tem o arquivo (em qualquer formato aceito) → bot aceita e segue.
 *   - A jornada original (rejeitar 72 dpi → reenviar 300 dpi) testava uma feature
 *     que nunca foi implementada e contradiz o .md (linhas 8-9).
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Validar arq. ✓ →
 *          Calcular → Apresentar → Aguardar aprov. → Dados entrega →
 *          Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, getSessionState, getSessionContext, getLastOS, cleanupUser, wait, uniquePhone, turno } from './helpers';

const PHONE = uniquePhone(3);
const NAME = 'Carla Teste F3';


describe('Fluxo 3 · Arquivo em JPEG — recepcionista valida técnico depois', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve aceitar arquivo em JPEG e seguir até a O.S. (recepcionista revisa)', async () => {
    await turno(PHONE, NAME, 'Olá! Quero fazer panfletos para um evento.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
    await turno(PHONE, NAME, 'Preciso de panfletos para divulgar um show.', 'COLETAR_ESPECIFICACOES', 'Identificar');
    await turno(PHONE, NAME, '500 unidades, tamanho A5, só frente colorida, papel couchê 90g.', 'VALIDAR_ARQUIVO', 'Coletar specs');

    // Cliente confirma que tem o arquivo (em JPEG). Bot aceita per .md — a validação
    // técnica (DPI, sangria, dimensões) é responsabilidade da recepcionista.
    await turno(PHONE, NAME, 'Tenho o arquivo pronto em JPEG.', 'AGUARDAR_APROVACAO', 'Validar arq. → chain Calcular → Apresentar', 30_000);

    await turno(PHONE, NAME, 'Aprovado! Pode continuar.', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
    await turno(PHONE, NAME, 'Vou retirar na loja.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
    await turno(PHONE, NAME, 'Confirmo o pedido.', 'ENCERRAR', 'Confirmar → chain Gerar O.S.', 30_000);

    const os = await getLastOS(PHONE);
    expect(os).not.toBeNull();
    // Fase 2: observações ficam vazias por padrão — recepcionista preenche durante revisão.
    expect(os!.observacoes ?? '').toBe('');

    await turno(PHONE, NAME, 'Obrigada! Até logo.', 'ENCERRAR', 'Encerrar');
  }, 130_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f3_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
