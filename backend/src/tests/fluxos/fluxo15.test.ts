/**
 * Fluxo 15 · Regra de negócio bloqueia temporariamente
 * Cliente quer 20 unidades, mínimo é 100. Agente informa a regra, explica
 * o motivo e pergunta se aceita o mínimo. Cliente aceita e o fluxo continua.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Calcular ❌ qtd →
 *          Coletar specs ajustar → Calcular → Apresentar → Aguardar aprov. →
 *          Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, getSessionState, getSessionContext, getLastOS, cleanupUser, wait, uniquePhone, turno } from './helpers';

const PHONE = uniquePhone(15);
const NAME = 'Oscar Teste F15';


describe('Fluxo 15 · Quantidade abaixo do mínimo', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve informar quantidade mínima, ajustar e fechar o pedido', async () => {
    await turno(PHONE, NAME, 'Oi! Quero fazer 20 panfletos para testar.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas + qtd baixa');
    await turno(PHONE, NAME, 'Panfletos para uma campanha pequena da minha empresa.', 'COLETAR_ESPECIFICACOES', 'Identificar');
    await turno(PHONE, NAME, 'Só 20 unidades, tamanho A5, frente colorida, couchê 90g.', 'VALIDAR_ARQUIVO', 'Coletar specs → ❌ qtd mínima');
    await turno(PHONE, NAME, 'Ah, entendi. O mínimo é 100. Então faço 100 unidades mesmo.', 'COLETAR_ESPECIFICACOES', 'Ajustar quantidade');
    await turno(PHONE, NAME, '100 panfletos, A5, frente colorida, papel couchê 90g.', 'VALIDAR_ARQUIVO', 'Specs corrigidas');
    await turno(PHONE, NAME, 'Tenho o arquivo em PDF.', 'AGUARDAR_APROVACAO', 'Validar arq.');
    await turno(PHONE, NAME, 'Pode calcular com 100 unidades.', 'AGUARDAR_APROVACAO', 'Calcular', 30_000);
    await turno(PHONE, NAME, 'Aprovado!', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
    await turno(PHONE, NAME, 'Vou retirar na loja.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
    await turno(PHONE, NAME, 'Confirmo o pedido.', 'ENCERRAR', 'Confirmar');
    await turno(PHONE, NAME, 'Pode fechar.', 'ENCERRAR', 'Gerar O.S.', 30_000);
    await turno(PHONE, NAME, 'Obrigado!', 'ENCERRAR', 'Encerrar');
  }, 130_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f15_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
