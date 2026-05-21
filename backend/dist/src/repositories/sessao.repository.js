"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessaoRepository = exports.SessaoRepository = void 0;
const prisma_1 = require("../config/prisma");
class SessaoRepository {
    async findActiveByClienteId(clienteId) {
        return prisma_1.prisma.sessaoAtendimento.findFirst({
            where: { clienteId, ativa: true },
            orderBy: { criadoEm: 'desc' },
        });
    }
    async findById(id) {
        return prisma_1.prisma.sessaoAtendimento.findUnique({ where: { id } });
    }
    async create(clienteId) {
        return prisma_1.prisma.sessaoAtendimento.create({
            data: {
                clienteId,
                estadoAtual: 'BOAS_VINDAS',
                contexto: {},
            },
        });
    }
    async updateState(id, estadoAtual, estadoAnterior, contexto) {
        return prisma_1.prisma.sessaoAtendimento.update({
            where: { id },
            data: {
                estadoAtual,
                ...(estadoAnterior !== undefined ? { estadoAnterior } : {}),
                ...(contexto !== undefined ? { contexto } : {}),
            },
        });
    }
    async updateContexto(id, contexto) {
        return prisma_1.prisma.sessaoAtendimento.update({
            where: { id },
            data: { contexto },
        });
    }
    async setLembreteEnviado(id, value) {
        return prisma_1.prisma.sessaoAtendimento.update({
            where: { id },
            data: { lembreteEnviado: value },
        });
    }
    async encerrar(id) {
        return prisma_1.prisma.sessaoAtendimento.update({
            where: { id },
            data: { ativa: false, estadoAtual: 'ENCERRAR' },
        });
    }
    async findAguardandoRetornoInativas(minutosInativo) {
        const limite = new Date(Date.now() - minutosInativo * 60 * 1000);
        return prisma_1.prisma.sessaoAtendimento.findMany({
            where: {
                ativa: true,
                estadoAtual: 'AGUARDAR_RETORNO',
                atualizadoEm: { lt: limite },
            },
            include: { cliente: true },
        });
    }
}
exports.SessaoRepository = SessaoRepository;
exports.sessaoRepository = new SessaoRepository();
