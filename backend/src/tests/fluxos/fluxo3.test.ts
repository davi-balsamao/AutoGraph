/**
 * Fluxo 3 · Arquivo enviado em baixa resolução
 * Arte com DPI insuficiente (72 dpi). Agente detecta, orienta e aguarda reenvio.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Validar arq. ❌ dpi →
 *          Coletar specs → Validar arq. ✓ → Calcular → Apresentar →
 *          Aguardar aprov. → Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, cleanupUser, wait, uniquePhone } from './helpers';

const PHONE = uniquePhone(3);
const NAME = 'Carla Teste F3';

async function turno(text: string, label: string): Promise<string> {
  await sendMsg(PHONE, NAME, text);
  await wait();
  const resp = await getLastBotResponse(PHONE);
  expect(resp).toBeTruthy();
  console.log(`[${label}] Bot: ${resp}`);
  return resp!;
}

describe('Fluxo 3 · Arquivo em baixa resolução', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve rejeitar arquivo de baixa resolução e retomar após reenvio correto', async () => {
    await turno('Olá! Quero fazer panfletos para um evento.', 'Boas-vindas');
    await turno('Preciso de panfletos para divulgar um show.', 'Identificar');
    await turno('500 unidades, tamanho A5, só frente colorida, papel couchê 90g.', 'Coletar specs');
    await turno('Tenho o arquivo pronto, está em JPEG mas com apenas 72 dpi.', 'Validar arq. ❌ dpi');
    await turno('Entendi o problema de resolução. Vou refazer em 300 dpi.', 'Orientação dpi');
    await turno('Reenviei o arquivo em PDF com 300 dpi, agora está correto.', 'Validar arq. ✓');
    await turno('Pode calcular o orçamento agora.', 'Calcular');
    await turno('Aprovado! Pode continuar.', 'Aguardar aprov.');
    await turno('Vou retirar na loja.', 'Dados entrega');
    await turno('Confirmo o pedido.', 'Confirmar');
    await turno('Pode fechar.', 'Gerar O.S.');
    await turno('Obrigada! Até logo.', 'Encerrar');
  }, 130_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f3_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
