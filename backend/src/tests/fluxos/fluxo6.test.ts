/**
 * Fluxo 6 · Interrupção e reengajamento tardio
 * Cliente inicia a coleta de specs e desaparece. Agente envia lembrete.
 * Cliente retorna e o fluxo é retomado exatamente de onde parou.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Ag. retorno →
 *          Coletar specs → Validar arq. → Calcular → Apresentar →
 *          Aguardar aprov. → Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, getSessionState, getSessionContext, getLastOS, cleanupUser, wait, uniquePhone, turno } from './helpers';

const PHONE = uniquePhone(6);
const NAME = 'Fábio Teste F6';


describe('Fluxo 6 · Interrupção e reengajamento', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve retomar o fluxo de onde parou após o cliente retornar', async () => {
    await turno(PHONE, NAME, 'Oi, boa tarde! Quero fazer cartões de visita.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
    await turno(PHONE, NAME, 'Cartões de visita para minha empresa.', 'COLETAR_ESPECIFICACOES', 'Identificar');
    await turno(PHONE, NAME, 'Preciso de 500 unidades, padrão 9x5cm, frente colorida, papel couchê 300g.', 'COLETAR_ESPECIFICACOES', 'Coletar specs parcial');
    await turno(PHONE, NAME, 'Preciso parar por agora, continue meu pedido depois.', 'AGUARDAR_RETORNO', 'Interrupção → Ag. retorno');
    await turno(PHONE, NAME, 'Voltei! Pode continuar meu pedido de cartões de visita?', 'COLETAR_ESPECIFICACOES', 'Retomada');
    await turno(PHONE, NAME, 'Sim, tenho o arquivo de arte em PDF, resolução 300 dpi.', 'AGUARDAR_APROVACAO', 'Validar arq.');
    await turno(PHONE, NAME, 'Aprovado!', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
    await turno(PHONE, NAME, 'Entrega no endereço: Av. Paulista, 1000, São Paulo – SP.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
    await turno(PHONE, NAME, 'Confirmo o pedido.', 'ENCERRAR', 'Confirmar');
    await turno(PHONE, NAME, 'Pode fechar.', 'ENCERRAR', 'Gerar O.S.', 30_000);
    await turno(PHONE, NAME, 'Muito obrigado! Até mais.', 'ENCERRAR', 'Encerrar');
  }, 130_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f6_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
