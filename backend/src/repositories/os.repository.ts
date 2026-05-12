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

  // Inicia o timer de produção
  async startTimer(id: string) {
    return prisma.ordensDeServico.update({
      where: { id },
      data: { timerStartedAt: new Date(), timerEndedAt: null }
    });
  }

  // Para o timer e calcula duração total
  async stopTimer(id: string) {
    const os = await prisma.ordensDeServico.findUnique({ where: { id } });
    if (!os || !os.timerStartedAt) throw new Error('Timer não iniciado.');

    const now = new Date();
    const elapsed = Math.floor((now.getTime() - os.timerStartedAt.getTime()) / 1000);
    const totalDuration = os.durationSeconds + elapsed;

    return prisma.ordensDeServico.update({
      where: { id },
      data: {
        timerEndedAt: now,
        durationSeconds: totalDuration,
        timerStartedAt: null,
      }
    });
  }
}