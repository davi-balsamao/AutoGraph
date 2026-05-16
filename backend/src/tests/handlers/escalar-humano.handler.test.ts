import { ConversationState } from '../../fsm/states';
import { escalarHumanoHandler } from '../../fsm/handlers/escalar-humano.handler';
import { makeDeps, makeSessao } from './helpers';

describe('EscalarHumanoHandler', () => {
  it('seta flag escalarHumano e responde com cortesia', async () => {
    const sessao = makeSessao({ estadoAnterior: 'NEGOCIAR' });
    const r = await escalarHumanoHandler.handle('quero falar com gerente', sessao, makeDeps());
    expect(r.escalarHumano).toBe(true);
    expect(r.nextState).toBe(ConversationState.ESCALAR_HUMANO);
    expect(r.response).toMatch(/atendente/i);
  });

  it('infere motivo "Reclamação" para mensagens com problema/erro', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const sessao = makeSessao({ estadoAnterior: 'BOAS_VINDAS' });
    await escalarHumanoHandler.handle('o pedido saiu todo errado', sessao, makeDeps());

    const calls = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(calls).toMatch(/Reclama[çc][ãa]o/);
    logSpy.mockRestore();
  });

  it('infere motivo "Negociação acima da margem"', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const sessao = makeSessao({ estadoAnterior: 'NEGOCIAR' });
    await escalarHumanoHandler.handle('isso é caro demais, vocês cobram absurdo', sessao, makeDeps());

    const calls = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(calls).toMatch(/Negocia[çc][ãa]o acima da margem/);
    logSpy.mockRestore();
  });
});
