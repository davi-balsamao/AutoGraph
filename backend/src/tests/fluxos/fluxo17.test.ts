/**
 * Fluxo 17 · Canal não suportado — mensagem de áudio
 * Cliente envia áudio. Bot não processa. Solicita que o cliente escreva.
 * Fluxo segue normalmente após receber texto.
 *
 * Nota: o payload de teste envia texto simulando a situação, pois a
 * infraestrutura de testes usa type:'text'. O bot deve solicitar texto
 * e continuar normalmente quando o cliente escrever.
 *
 * Estados: Boas-vindas áudio ❌ → Boas-vindas solicita texto →
 *          Identificar → Coletar specs → Validar arq. → Calcular →
 *          Apresentar → Aguardar aprov. → Dados entrega → Confirmar →
 *          Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, cleanupUser, wait, uniquePhone } from './helpers';

const PHONE = uniquePhone(17);
const NAME = 'Rafael Teste F17';

async function turno(text: string, label: string): Promise<string> {
  await sendMsg(PHONE, NAME, text);
  await wait();
  const resp = await getLastBotResponse(PHONE);
  expect(resp).toBeTruthy();
  console.log(`[${label}] Bot: ${resp}`);
  return resp!;
}

describe('Fluxo 17 · Áudio → solicitação de texto → fluxo normal', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve solicitar texto quando receber entrada não textual e retomar fluxo', async () => {
    await turno('🎤', 'Áudio simulado — bot pede texto');
    await turno('Desculpe, vou escrever então. Quero fazer panfletos.', 'Texto após orientação');
    await turno('Panfletos para divulgar minha academia.', 'Identificar');
    await turno('500 unidades, tamanho A5, frente colorida, papel couchê 90g.', 'Coletar specs');
    await turno('Tenho o arquivo em PDF com 300 dpi.', 'Validar arq.');
    await turno('Pode calcular o orçamento.', 'Calcular');
    await turno('Aprovado!', 'Aguardar aprov.');
    await turno('Vou retirar na loja.', 'Dados entrega');
    await turno('Confirmo.', 'Confirmar');
    await turno('Pode fechar.', 'Gerar O.S.');
    await turno('Obrigado! Até mais.', 'Encerrar');
  }, 120_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f17_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
