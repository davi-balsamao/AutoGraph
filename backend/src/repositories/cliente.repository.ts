import { prisma } from '../config/prisma';

export class ClienteRepository {
  async findByPhone(telefone: string) {
    return prisma.usuario.findFirst({ where: { telefone } });
  }

  async findById(id: string) {
    return prisma.usuario.findUnique({
      where: { id },
    });
  }

  async updateAtendimentoStatus(id: string, status: boolean) {
    return prisma.usuario.update({
      where: { id },
      data: { atendimentoHumano: status },
    });
  }

  async create(data: { nome: string; telefone: string }) {
    return prisma.usuario.create({
      data: {
        nome: data.nome,
        telefone: data.telefone,
        role: 'CLIENTE',
      },
    });
  }
}