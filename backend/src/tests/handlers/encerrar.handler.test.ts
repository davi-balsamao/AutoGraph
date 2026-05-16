import { encerrarHandler } from '../../fsm/handlers/encerrar.handler';
import { ConversationState } from '../../fsm/states';
import { makeDeps, makeSessao } from './helpers';

describe('EncerrarHandler', () => {
  it('inclui número da O.S. quando contexto tem osId', async () => {
    const sessao = makeSessao({
      contexto: { osId: 'abcdef1234567890', produto: 'Panfletos' },
    });
    const r = await encerrarHandler.handle(
      'Obrigado!',
      sessao,
      makeDeps({ clienteNome: 'Davi Balsamao' })
    );

    expect(r.nextState).toBe(ConversationState.ENCERRAR);
    expect(r.response).toContain('Davi');
    expect(r.response).toContain('ABCDEF12');
    expect(r.response).toMatch(/O\.S\./);
  });

  it('responde sem O.S. quando contexto está vazio (recusa, indisponível, etc.)', async () => {
    const sessao = makeSessao({ contexto: {} });
    const r = await encerrarHandler.handle('Tchau', sessao, makeDeps({ clienteNome: 'Ana' }));

    expect(r.nextState).toBe(ConversationState.ENCERRAR);
    expect(r.response).toContain('Ana');
    expect(r.response).not.toMatch(/O\.S\./);
  });

  it('lida graciosamente com cliente sem nome', async () => {
    const sessao = makeSessao({ contexto: {} });
    const r = await encerrarHandler.handle('', sessao, makeDeps({ clienteNome: '' }));
    expect(r.response).toContain('cliente');
  });
});
