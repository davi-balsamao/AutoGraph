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

  async findHistoryByOsId(osId: string) {
    // 1. Acha a OS para descobrir quem é o cliente e quando a OS foi criada
    const os = await prisma.ordensDeServico.findUnique({
      where: { id: osId },
      select: { clienteId: true, criadoEm: true },
    });

    if (!os) return null;

    // 2. Busca o histórico do cliente até o momento em que a OS foi criada
    const mensagens = await prisma.mensagens.findMany({
      where: {
        usuarioId: os.clienteId,
        criadoEm: {
          lte: os.criadoEm, // Pega só as mensagens antes ou no exato momento da criação da OS
        },
      },
      orderBy: { criadoEm: 'asc' }, // Ordem cronológica
    });

    return mensagens;
  }
}