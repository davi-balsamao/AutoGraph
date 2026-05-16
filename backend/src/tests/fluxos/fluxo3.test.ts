/**
 * Fluxo 3 · Arquivo enviado em baixa resolução
 * Arte com DPI insuficiente (72 dpi). Agente detecta, orienta e aguarda reenvio.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Validar arq. ❌ dpi →
 *          Coletar specs → Validar arq. ✓ → Calcular → Apresentar →
 *          Aguardar aprov. → Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, getSessionState, getSessionContext, getLastOS, cleanupUser, wait, uniquePhone, turno } from './helpers';

const PHONE = uniquePhone(3);
const NAME = 'Carla Teste F3';


describe('Fluxo 3 · Arquivo em baixa resolução', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve rejeitar arquivo de baixa resolução e retomar após reenvio correto', async () => {
    await turno(PHONE, NAME, 'Olá! Quero fazer panfletos para um evento.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
    await turno(PHONE, NAME, 'Preciso de panfletos para divulgar um show.', 'COLETAR_ESPECIFICACOES', 'Identificar');
    await turno(PHONE, NAME, '500 unidades, tamanho A5, só frente colorida, papel couchê 90g.', 'VALIDAR_ARQUIVO', 'Coletar specs');
    await turno(PHONE, NAME, 'Tenho o arquivo pronto, está em JPEG mas com apenas 72 dpi.', 'VALIDAR_ARQUIVO', 'Validar arq. ❌ dpi');
    await turno(PHONE, NAME, 'Entendi o problema de resolução. Vou refazer em 300 dpi.', 'ESCLARECER_DUVIDA', 'Orientação dpi');
    await turno(PHONE, NAME, 'Reenviei o arquivo em PDF com 300 dpi, agora está correto.', 'AGUARDAR_APROVACAO', 'Validar arq. ✓');
    await turno(PHONE, NAME, 'Pode calcular o orçamento agora.', 'AGUARDAR_APROVACAO', 'Calcular', 30_000);
    await turno(PHONE, NAME, 'Aprovado! Pode continuar.', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
    await turno(PHONE, NAME, 'Vou retirar na loja.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
    await turno(PHONE, NAME, 'Confirmo o pedido.', 'ENCERRAR', 'Confirmar');
    await turno(PHONE, NAME, 'Pode fechar.', 'ENCERRAR', 'Gerar O.S.', 30_000);
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
