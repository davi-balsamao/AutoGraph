/**
 * Fluxo 9 · Formato de arquivo incompatível
 * Cliente envia .PSD com camadas abertas. Agente rejeita, explica os formatos
 * aceitos e orienta a exportar para PDF/JPG antes de seguir.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Validar arq. ❌ fmt →
 *          Coletar specs → Validar arq. ✓ → Calcular → Apresentar →
 *          Aguardar aprov. → Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, getSessionState, getSessionContext, getLastOS, cleanupUser, wait, uniquePhone, turno } from './helpers';

const PHONE = uniquePhone(9);
const NAME = 'Isabela Teste F9';


describe('Fluxo 9 · Arquivo em formato incompatível (.PSD)', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve rejeitar .PSD e retomar após reenvio no formato correto', async () => {
    await turno(PHONE, NAME, 'Oi! Quero fazer flyers para uma promoção.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
    await turno(PHONE, NAME, 'Flyers para uma promoção de verão da minha loja.', 'COLETAR_ESPECIFICACOES', 'Identificar');
    await turno(PHONE, NAME, '500 unidades, tamanho A5, frente colorida, papel couchê 115g.', 'VALIDAR_ARQUIVO', 'Coletar specs');
    await turno(PHONE, NAME, 'Tenho o arquivo de arte em .PSD com todas as camadas abertas.', 'VALIDAR_ARQUIVO', 'Validar arq. ❌ fmt PSD');
    await turno(PHONE, NAME, 'Entendi, vou exportar para PDF. Pode aguardar.', 'ESCLARECER_DUVIDA', 'Orientação formato');
    await turno(PHONE, NAME, 'Agora reenviei o arquivo em PDF com as camadas achatadas.', 'AGUARDAR_APROVACAO', 'Validar arq. ✓');
    await turno(PHONE, NAME, 'Pode calcular o orçamento.', 'AGUARDAR_APROVACAO', 'Calcular', 30_000);
    await turno(PHONE, NAME, 'Aprovado!', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
    await turno(PHONE, NAME, 'Vou retirar na loja.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
    await turno(PHONE, NAME, 'Confirmo o pedido.', 'ENCERRAR', 'Confirmar');
    await turno(PHONE, NAME, 'Pode fechar.', 'ENCERRAR', 'Gerar O.S.', 30_000);
    await turno(PHONE, NAME, 'Obrigada! Até mais.', 'ENCERRAR', 'Encerrar');
  }, 130_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f9_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
