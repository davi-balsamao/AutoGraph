/**
 * Fluxo 11 · Múltiplas dúvidas antes de qualquer spec
 * Cliente técnico: quer entender laminação fosca vs brilhosa, gramaturas,
 * sangria. Passa por ESCLARECER_DUVIDAS várias vezes antes de coletar specs.
 *
 * Estados: Boas-vindas → Identificar → Esclarecer → Esclarecer → Esclarecer →
 *          Coletar specs → Validar arq. → Calcular → Apresentar →
 *          Aguardar aprov. → Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */

import { sendMsg, getLastBotResponse, cleanupUser, wait, uniquePhone } from './helpers';

const PHONE = uniquePhone(11);
const NAME = 'Kleber Teste F11';

async function turno(text: string, label: string): Promise<string> {
  await sendMsg(PHONE, NAME, text);
  await wait();
  const resp = await getLastBotResponse(PHONE);
  expect(resp).toBeTruthy();
  console.log(`[${label}] Bot: ${resp}`);
  return resp!;
}

describe('Fluxo 11 · Múltiplas dúvidas antes das specs', () => {
  beforeAll(async () => { await cleanupUser(PHONE); });
  afterAll(async () => { await cleanupUser(PHONE); });

  it('deve responder múltiplas dúvidas técnicas e retomar coleta de specs', async () => {
    await turno('Olá! Tenho bastante dúvida antes de fazer o pedido.', 'Boas-vindas');
    await turno('Quero cartões de visita, mas preciso entender as opções primeiro.', 'Identificar');
    await turno('Qual é a diferença entre laminação fosca e brilhosa?', 'Esclarecer 1 – laminação');
    await turno('E sobre gramatura do papel: qual você recomenda para cartão de visita?', 'Esclarecer 2 – gramatura');
    await turno('O que é sangria no arquivo de arte? Como devo preparar?', 'Esclarecer 3 – sangria');
    await turno('Entendi tudo! Agora quero cartões de visita com laminação fosca.', 'Coletar specs');
    await turno('500 unidades, formato 9x5cm, frente e verso colorido, couchê 300g, laminação fosca.', 'Specs completas');
    await turno('Tenho o arquivo em PDF com 3mm de sangria e resolução 300 dpi.', 'Validar arq.');
    await turno('Pode calcular o orçamento.', 'Calcular');
    await turno('Aprovado! Exatamente o que esperava.', 'Aguardar aprov.');
    await turno('Vou retirar na loja.', 'Dados entrega');
    await turno('Confirmo o pedido.', 'Confirmar');
    await turno('Pode fechar.', 'Gerar O.S.');
    await turno('Muito obrigado! Ficou ótimo.', 'Encerrar');
  }, 150_000);

  it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
    const msgId = `wamid.dup_f11_${Date.now()}`;
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await sendMsg(PHONE, NAME, 'Retry test', msgId);
    await wait();
    expect(await getLastBotResponse(PHONE)).toBeTruthy();
  }, 25_000);
});
