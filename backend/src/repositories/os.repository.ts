import { prisma } from '../config/prisma';
import { StatusOS } from '@prisma/client';

export class OsRepository {
  async create(data: any) {
    return prisma.ordensDeServico.create({ data });
  }

  async findById(id: string) {
    return prisma.ordensDeServico.findUnique({
      where: { id },
      include: { cliente: true }
    });
  }

  // Lista OS com filtro opcional de status
  async findAll(status?: StatusOS) {
    return prisma.ordensDeServico.findMany({
      where: status ? { status } : {},
      include: { 
        cliente: {
          select: { nome: true, telefone: true }
        } 
      },
      orderBy: { criadoEm: 'desc' }
    });
  }

  // Atualiza apenas o status da OS
  async updateStatus(id: string, status: StatusOS) {
    return prisma.ordensDeServico.update({
      where: { id },
      data: { status }
    });
  }
}