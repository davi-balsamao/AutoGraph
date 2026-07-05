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

  // Lista as últimas OS de um cliente (mais recentes primeiro).
  async findByCliente(clienteId: string, limit: number = 5) {
    return prisma.ordensDeServico.findMany({
      where: { clienteId },
      orderBy: { criadoEm: 'desc' },
      take: limit,
    });
  }

  // Lista OS com filtros opcionais de status e cliente
  async findAll(status?: StatusOS, clienteId?: string) {
    return prisma.ordensDeServico.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(clienteId ? { clienteId } : {}),
      },
      include: { 
        cliente: {
          select: { nome: true, telefone: true, enderecoCompleto: true, enderecoReferencia: true }
        } 
      },
      orderBy: { criadoEm: 'desc' }
    });
  }

  // Atualiza apenas o status da OS
  async updateStatus(id: string, status: StatusOS) {
    const os = await prisma.ordensDeServico.findUnique({ where: { id } });
    if (!os) throw new Error('OS não encontrada');

    const data: any = { status };

    // Se mudou para EM_PRODUCAO, inicia o timer se já não estiver rodando
    if (status === StatusOS.EM_PRODUCAO) {
      if (!os.timerStartedAt) {
        data.timerStartedAt = new Date();
        data.timerEndedAt = null;
      }
    } else {
      // Se mudou de EM_PRODUCAO para outro status, para o timer e atualiza a duração
      if (os.timerStartedAt) {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - os.timerStartedAt.getTime()) / 1000);
        data.durationSeconds = os.durationSeconds + elapsed;
        data.timerEndedAt = now;
        data.timerStartedAt = null;
      }
    }

    return prisma.ordensDeServico.update({
      where: { id },
      data
    });
  }

  // Atualiza dados variados (observacoes, especificacoes)
  async updateData(id: string, data: any) {
    return prisma.ordensDeServico.update({
      where: { id },
      data
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