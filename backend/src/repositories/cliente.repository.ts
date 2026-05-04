import { prisma } from '../config/prisma';

export class ClienteRepository {
  async findByPhone(telefone: string) {
    return prisma.usuario.findFirst({ where: { telefone } });
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
