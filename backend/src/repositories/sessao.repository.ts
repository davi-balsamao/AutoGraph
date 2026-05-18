import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

export class SessaoRepository {
  async findActiveByClienteId(clienteId: string) {
    return prisma.sessaoAtendimento.findFirst({
      where: { clienteId, ativa: true },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.sessaoAtendimento.findUnique({ where: { id } });
  }

  async create(clienteId: string) {
    return prisma.sessaoAtendimento.create({
      data: {
        clienteId,
        estadoAtual: 'BOAS_VINDAS',
        contexto: {},
      },
    });
  }

  async updateState(
    id: string,
    estadoAtual: string,
    estadoAnterior?: string | null,
    contexto?: Prisma.InputJsonValue
  ) {
    return prisma.sessaoAtendimento.update({
      where: { id },
      data: {
        estadoAtual,
        ...(estadoAnterior !== undefined ? { estadoAnterior } : {}),
        ...(contexto !== undefined ? { contexto } : {}),
      },
    });
  }

  async updateContexto(id: string, contexto: Prisma.InputJsonValue) {
    return prisma.sessaoAtendimento.update({
      where: { id },
      data: { contexto },
    });
  }

  async setLembreteEnviado(id: string, value: boolean) {
    return prisma.sessaoAtendimento.update({
      where: { id },
      data: { lembreteEnviado: value },
    });
  }

  async encerrar(id: string) {
    return prisma.sessaoAtendimento.update({
      where: { id },
      data: { ativa: false, estadoAtual: 'ENCERRAR' },
    });
  }

  async findAguardandoRetornoInativas(minutosInativo: number) {
    const limite = new Date(Date.now() - minutosInativo * 60 * 1000);
    return prisma.sessaoAtendimento.findMany({
      where: {
        ativa: true,
        estadoAtual: 'AGUARDAR_RETORNO',
        atualizadoEm: { lt: limite },
      },
      include: { cliente: true },
    });
  }
}

export const sessaoRepository = new SessaoRepository();
