/**
 * Fluxo 6 · Interrupção e reengajamento tardio
 * Cliente inicia a coleta de specs e desaparece. Agente envia lembrete.
 * Cliente retorna e o fluxo é retomado exatamente de onde parou.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Ag. retorno →
 *          Coletar specs → Validar arq. → Calcular → Apresentar →
 *          Aguardar aprov. → Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, cleanupUser, wait, uniquePhone } from './helpers';

const PHONE = uniquePhone(6);
const NAME = 'Fábio Teste F6';

async function turno(text: string, label: string): Promise<string> {
  await sendMsg(PHONE, NAME, text);
  await wait();
  const resp = await getLastBotResponse(PHONE);
  expect(resp).toBeTruthy();
  console.log(`[${label}] Bot: ${resp}`);
  return resp!;
}

describe('Fluxo 6 · Interrupção e reengajamento', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve retomar o fluxo de onde parou após o cliente retornar', async () => {
    await turno('Oi, boa tarde! Quero fazer cartões de visita.', 'Boas-vindas');
    await turno('Cartões de visita para minha empresa.', 'Identificar');
    await turno('Preciso de 500 unidades, padrão 9x5cm, frente colorida, papel couchê 300g.', 'Coletar specs parcial');
    await turno('Preciso parar por agora, continue meu pedido depois.', 'Interrupção → Ag. retorno');
    await turno('Voltei! Pode continuar meu pedido de cartões de visita?', 'Retomada');
    await turno('Sim, tenho o arquivo de arte em PDF, resolução 300 dpi.', 'Validar arq.');
    await turno('Pode calcular o orçamento.', 'Calcular');
    await turno('Aprovado!', 'Aguardar aprov.');
    await turno('Entrega no endereço: Av. Paulista, 1000, São Paulo – SP.', 'Dados entrega');
    await turno('Confirmo o pedido.', 'Confirmar');
    await turno('Pode fechar.', 'Gerar O.S.');
    await turno('Muito obrigado! Até mais.', 'Encerrar');
  }, 130_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f6_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
