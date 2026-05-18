"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OsRepository = void 0;
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
class OsRepository {
    async create(data) {
        return prisma_1.prisma.ordensDeServico.create({ data });
    }
    async findById(id) {
        return prisma_1.prisma.ordensDeServico.findUnique({
            where: { id },
            include: { cliente: true }
        });
    }
    // Lista OS com filtro opcional de status
    async findAll(status) {
        return prisma_1.prisma.ordensDeServico.findMany({
            where: status ? { status } : {},
            include: {
                cliente: {
                    select: { nome: true, telefone: true, enderecoCompleto: true, enderecoReferencia: true }
                }
            },
            orderBy: { criadoEm: 'desc' }
        });
    }
    // Atualiza apenas o status da OS
    async updateStatus(id, status) {
        const os = await prisma_1.prisma.ordensDeServico.findUnique({ where: { id } });
        if (!os)
            throw new Error('OS não encontrada');
        const data = { status };
        // Se mudou para EM_PRODUCAO, inicia o timer se já não estiver rodando
        if (status === client_1.StatusOS.EM_PRODUCAO) {
            if (!os.timerStartedAt) {
                data.timerStartedAt = new Date();
                data.timerEndedAt = null;
            }
        }
        else {
            // Se mudou de EM_PRODUCAO para outro status, para o timer e atualiza a duração
            if (os.timerStartedAt) {
                const now = new Date();
                const elapsed = Math.floor((now.getTime() - os.timerStartedAt.getTime()) / 1000);
                data.durationSeconds = os.durationSeconds + elapsed;
                data.timerEndedAt = now;
                data.timerStartedAt = null;
            }
        }
        return prisma_1.prisma.ordensDeServico.update({
            where: { id },
            data
        });
    }
    // Atualiza dados variados (observacoes, especificacoes)
    async updateData(id, data) {
        return prisma_1.prisma.ordensDeServico.update({
            where: { id },
            data
        });
    }
    // Inicia o timer de produção
    async startTimer(id) {
        return prisma_1.prisma.ordensDeServico.update({
            where: { id },
            data: { timerStartedAt: new Date(), timerEndedAt: null }
        });
    }
    // Para o timer e calcula duração total
    async stopTimer(id) {
        const os = await prisma_1.prisma.ordensDeServico.findUnique({ where: { id } });
        if (!os || !os.timerStartedAt)
            throw new Error('Timer não iniciado.');
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - os.timerStartedAt.getTime()) / 1000);
        const totalDuration = os.durationSeconds + elapsed;
        return prisma_1.prisma.ordensDeServico.update({
            where: { id },
            data: {
                timerEndedAt: now,
                durationSeconds: totalDuration,
                timerStartedAt: null,
            }
        });
    }
}
exports.OsRepository = OsRepository;
