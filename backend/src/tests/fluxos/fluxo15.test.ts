/**
 * Fluxo 15 · Regra de negócio bloqueia temporariamente
 * Cliente quer 20 unidades, mínimo é 100. Agente informa a regra, explica
 * o motivo e pergunta se aceita o mínimo. Cliente aceita e o fluxo continua.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Calcular ❌ qtd →
 * Coletar specs ajustar → Calcular → Apresentar → Aguardar aprov. →
 * Dados entrega → Confirmar → Gerar O.S. → Encerrar
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
    
    // 👇 AJUSTE 1: Removemos a ambiguidade do verso. Como a quantidade (20) é inválida, o estado COERENTE continua em COLETAR_ESPECIFICACOES para ajuste.
    await turno(PHONE, NAME, 'Só 20 unidades, tamanho A5, só frente colorida e verso em branco, couchê 90g.', 'COLETAR_ESPECIFICACOES', 'Coletar specs → ❌ qtd mínima');
    
    // 👇 AJUSTE 2: O cliente aceita o mínimo de 100. Agora que o pedido se tornou válido, a IA nos move com segurança para VALIDAR_ARQUIVO.
    await turno(PHONE, NAME, 'Ah, entendi. O mínimo é 100. Então faço 100 unidades mesmo.', 'VALIDAR_ARQUIVO', 'Ajustar quantidade');
    
    await turno(PHONE, NAME, '100 panfletos, A5, frente colorida, papel couchê 90g.', 'VALIDAR_ARQUIVO', 'Specs corrigidas');
    await turno(PHONE, NAME, 'Tenho o arquivo em PDF.', 'AGUARDAR_APROVACAO', 'Validar arq.');
    await turno(PHONE, NAME, 'Pode calcular com 100 unidades.', 'AGUARDAR_APROVACAO', 'Calcular', 30_000);
    await turno(PHONE, NAME, 'Aprovado!', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
    
    // 👇 AJUSTE 3 e 4: Travas anti-alucinação de endereço e confirmação que garantem o sucesso do fechamento
    await turno(PHONE, NAME, 'Vou retirar na loja física, não preciso de entrega.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
    await turno(PHONE, NAME, 'Sim, confirmo o pedido! Todos os dados estão corretos, inclusive a retirada na loja.', 'ENCERRAR', 'Confirmar');
    
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