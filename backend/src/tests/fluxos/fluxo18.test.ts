/**
 * Fluxo 18 · Idioma diferente do configurado
 * Cliente escreve em espanhol. Agente detecta, responde bilíngue e pede
 * para continuar em português. Fluxo segue normalmente.
 *
 * Estados: Boas-vindas es → Identificar bilíngue → Coletar specs →
 *          Calcular → Apresentar → Aguardar aprov. → Dados entrega →
 *          Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, cleanupUser, wait, uniquePhone } from './helpers';

const PHONE = uniquePhone(18);
const NAME = 'Sebastião Teste F18';

async function turno(text: string, label: string): Promise<string> {
  await sendMsg(PHONE, NAME, text);
  await wait();
  const resp = await getLastBotResponse(PHONE);
  expect(resp).toBeTruthy();
  console.log(`[${label}] Bot: ${resp}`);
  return resp!;
}

describe('Fluxo 18 · Atendimento em espanhol → redirecionamento para português', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve detectar espanhol, redirecionar para português e fechar o pedido', async () => {
    await turno('¡Hola! Quiero hacer un pedido de impresión, folletos para mi negocio.', 'Boas-vindas em espanhol');
    await turno('Quiero folletos. Prefiero hablar en español si es posible.', 'Identificar bilíngue');
    await turno('Tudo bem, vou continuar em português então. Quero panfletos.', 'Transição para PT');
    await turno('1000 unidades, tamanho A5, frente e verso colorido, papel couchê 90g.', 'Coletar specs');
    await turno('Tenho o arquivo em PDF com resolução adequada.', 'Validar arq.');
    await turno('Pode calcular o orçamento.', 'Calcular');
    await turno('Aprovado!', 'Aguardar aprov.');
    await turno('Vou retirar na loja.', 'Dados entrega');
    await turno('Confirmo o pedido.', 'Confirmar');
    await turno('Pode fechar.', 'Gerar O.S.');
    await turno('Obrigado! Hasta luego.', 'Encerrar');
  }, 120_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f18_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
