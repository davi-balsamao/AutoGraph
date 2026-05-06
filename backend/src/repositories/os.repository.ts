/**
 * OsRepository — Card 16: Criação Automática de Ordem de Serviço
 *
 * Repository para persistência das Ordens de Serviço no PostgreSQL.
 * Segue o padrão Controller → Service → Repository do projeto.
 */

import { prisma } from '../config/prisma';
import { StatusOS } from '@prisma/client';

export class OsRepository {
  /**
   * Cria uma nova Ordem de Serviço com status AGUARDANDO_ORCAMENTO.
   */
  async create(data: {
    clienteId: string;
    especificacoes: object;
  }) {
    return prisma.ordensDeServico.create({
      data: {
        clienteId: data.clienteId,
        status: 'AGUARDANDO_ORCAMENTO',
        especificacoes: data.especificacoes,
      },
    });
  }

  /**
   * Busca uma OS pelo ID.
   */
  async findById(id: string) {
    return prisma.ordensDeServico.findUnique({
      where: { id },
      include: { cliente: true },
    });
  }

  /**
   * Busca todas as OS de um cliente.
   */
  async findByClienteId(clienteId: string) {
    return prisma.ordensDeServico.findMany({
      where: { clienteId },
      orderBy: { criadoEm: 'desc' },
    });
  }

  /**
   * Atualiza o status de uma OS.
   */
  async updateStatus(id: string, status: StatusOS) {
    return prisma.ordensDeServico.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Lista todas as OS com status AGUARDANDO_ORCAMENTO (para a recepcionista).
   */
  async findPendingOrders() {
    return prisma.ordensDeServico.findMany({
      where: { status: 'AGUARDANDO_ORCAMENTO' },
      include: { cliente: true },
      orderBy: { criadoEm: 'desc' },
    });
  }
}

export const osRepository = new OsRepository();
