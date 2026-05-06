import { prisma } from '../config/prisma';
import { OrigemMensagem } from '@prisma/client';

export class MensagemRepository {
  async create(data: {
    usuarioId: string;
    payload: object;
    origem: OrigemMensagem;
    ordemId?: string;
  }) {
    return prisma.mensagens.create({ data });
  }

  async findByUsuarioId(usuarioId: string, limit?: number) {
    return prisma.mensagens.findMany({
      where: { usuarioId },
      orderBy: { criadoEm: 'desc' },
      ...(limit ? { take: limit } : {}),
    });
  }
}
