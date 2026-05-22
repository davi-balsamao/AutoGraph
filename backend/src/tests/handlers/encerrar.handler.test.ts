const mockOsFindById = jest.fn();
const mockOsUpdateStatus = jest.fn();

jest.mock('../../repositories/os.repository', () => ({
  OsRepository: jest.fn().mockImplementation(() => ({
    findById: mockOsFindById,
    updateStatus: mockOsUpdateStatus,
  })),
}));

jest.mock('../../server', () => ({
  io: {
    emit: jest.fn(),
  },
}));

import { ConversationState } from '../../fsm/states';
import { StatusOS } from '@prisma/client';
import { makeDeps, makeSessao } from './helpers';

const { encerrarHandler } = require('../../fsm/handlers/encerrar.handler');

describe('EncerrarHandler', () => {
  beforeEach(() => {
    mockOsFindById.mockReset();
    mockOsUpdateStatus.mockReset();
  });

  it('inclui número da O.S. quando contexto tem osId', async () => {
    mockOsFindById.mockResolvedValue({ id: 'abcdef1234567890', status: StatusOS.CRIADA });
    
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
    
    // Não deve atualizar status pois já está APROVADO
    expect(mockOsUpdateStatus).not.toHaveBeenCalled();
  });

  it('cancela OS ativa se o status for CRIADA ou AGUARDANDO_ORCAMENTO', async () => {
    mockOsFindById.mockResolvedValue({ id: 'abcdef1234567890', status: StatusOS.AGUARDANDO_ORCAMENTO });
    mockOsUpdateStatus.mockResolvedValue({ id: 'abcdef1234567890', status: StatusOS.CANCELADA });

    const sessao = makeSessao({
      contexto: { osId: 'abcdef1234567890', produto: 'Panfletos' },
    });
    await encerrarHandler.handle(
      'Recusar orçamento',
      sessao,
      makeDeps({ clienteNome: 'Davi Balsamao' })
    );

    expect(mockOsFindById).toHaveBeenCalledWith('abcdef1234567890');
    expect(mockOsUpdateStatus).toHaveBeenCalledWith('abcdef1234567890', StatusOS.CANCELADA);
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
