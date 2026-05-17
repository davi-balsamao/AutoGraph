/**
 * Fluxo 14 · Ambiguidade impede identificar o produto
 * "Oi, preciso de cartão." — Cartão de visita? Postal? Fidelidade?
 * Agente pede clareza, cliente especifica e o fluxo segue normalmente.
 *
 * Estados: Boas-vindas → Identificar clarificar → Identificar →
 * Coletar specs → Calcular → Apresentar → Aguardar aprov. →
 * Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, getSessionState, getSessionContext, getLastOS, cleanupUser, wait, uniquePhone, turno } from './helpers';

const PHONE = uniquePhone(14);
const NAME = 'Natalia Teste F14';

describe('Fluxo 14 · Ambiguidade no produto solicitado', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve pedir clareza sobre o produto e fechar o pedido após identificação', async () => {
    await turno(PHONE, NAME, 'Oi, preciso de cartão.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas + ambiguidade');
    await turno(PHONE, NAME, 'Cartão de visita para a minha empresa.', 'COLETAR_ESPECIFICACOES', 'Identificar clarificado');
    
    // 👇 Mudamos o estado esperado aqui para COLETAR_ESPECIFICACOES (porque sabemos que ele vai perguntar do verniz)
    await turno(PHONE, NAME, '500 unidades, formato 9x5cm, só frente colorida e verso em branco, papel couchê 300g.', 'COLETAR_ESPECIFICACOES', 'Coletar specs basicas');
    
    // 👇 ADICIONAMOS ESSA LINHA: Respondemos o bot e aí sim ele vai para a validação do PDF!
    await turno(PHONE, NAME, 'Não terá verniz, pode ser fosco mesmo.', 'VALIDAR_ARQUIVO', 'Finalizar specs (verniz)');
    
    // "Tenho o arquivo em PDF..." em VALIDAR_ARQUIVO já dispara CALCULAR_ORCAMENTO
    // → APRESENTAR_ORCAMENTO → AGUARDAR_APROVACAO, com a mensagem do orçamento.
    // Um turno extra "Pode calcular." antes da aprovação seria redundante (orçamento
    // já está na tela) e instável (RAG do AGUARDAR_APROVACAO pode demorar). Pula direto.
    await turno(PHONE, NAME, 'Tenho o arquivo em PDF com sangria de 3mm.', 'AGUARDAR_APROVACAO', 'Validar arq.');
    await turno(PHONE, NAME, 'Aprovado!', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
    
    await turno(PHONE, NAME, 'Vou retirar na loja física, não preciso de entrega.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
    await turno(PHONE, NAME, 'Sim, confirmo o pedido! Todos os dados estão corretos, inclusive a retirada na loja.', 'ENCERRAR', 'Confirmar');
    
    await turno(PHONE, NAME, 'Pode fechar.', 'ENCERRAR', 'Gerar O.S.', 30_000);
    await turno(PHONE, NAME, 'Obrigada! Até mais.', 'ENCERRAR', 'Encerrar');
  }, 110_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f14_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});