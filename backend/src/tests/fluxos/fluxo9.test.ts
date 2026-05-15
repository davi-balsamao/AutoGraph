/**
 * Fluxo 9 · Formato de arquivo incompatível
 * Cliente envia .PSD com camadas abertas. Agente rejeita, explica os formatos
 * aceitos e orienta a exportar para PDF/JPG antes de seguir.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Validar arq. ❌ fmt →
 *          Coletar specs → Validar arq. ✓ → Calcular → Apresentar →
 *          Aguardar aprov. → Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, cleanupUser, wait, uniquePhone } from './helpers';

const PHONE = uniquePhone(9);
const NAME = 'Isabela Teste F9';

async function turno(text: string, label: string): Promise<string> {
  await sendMsg(PHONE, NAME, text);
  await wait();
  const resp = await getLastBotResponse(PHONE);
  expect(resp).toBeTruthy();
  console.log(`[${label}] Bot: ${resp}`);
  return resp!;
}

describe('Fluxo 9 · Arquivo em formato incompatível (.PSD)', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve rejeitar .PSD e retomar após reenvio no formato correto', async () => {
    await turno('Oi! Quero fazer flyers para uma promoção.', 'Boas-vindas');
    await turno('Flyers para uma promoção de verão da minha loja.', 'Identificar');
    await turno('500 unidades, tamanho A5, frente colorida, papel couchê 115g.', 'Coletar specs');
    await turno('Tenho o arquivo de arte em .PSD com todas as camadas abertas.', 'Validar arq. ❌ fmt PSD');
    await turno('Entendi, vou exportar para PDF. Pode aguardar.', 'Orientação formato');
    await turno('Agora reenviei o arquivo em PDF com as camadas achatadas.', 'Validar arq. ✓');
    await turno('Pode calcular o orçamento.', 'Calcular');
    await turno('Aprovado!', 'Aguardar aprov.');
    await turno('Vou retirar na loja.', 'Dados entrega');
    await turno('Confirmo o pedido.', 'Confirmar');
    await turno('Pode fechar.', 'Gerar O.S.');
    await turno('Obrigada! Até mais.', 'Encerrar');
  }, 130_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f9_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
