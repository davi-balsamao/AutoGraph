"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MensagemRepository = void 0;
const prisma_1 = require("../config/prisma");
class MensagemRepository {
    async create(data) {
        return prisma_1.prisma.mensagens.create({ data });
    }
    async findByUsuarioId(usuarioId, limit) {
        return prisma_1.prisma.mensagens.findMany({
            where: { usuarioId },
            orderBy: { criadoEm: 'desc' },
            ...(limit ? { take: limit } : {}),
        });
    }
    async findHistoryByOsId(osId) {
        // 1. Acha a OS para descobrir quem é o cliente e quando a OS foi criada
        const os = await prisma_1.prisma.ordensDeServico.findUnique({
            where: { id: osId },
            select: { clienteId: true, criadoEm: true },
        });
        if (!os)
            return null;
        // 2. Busca o histórico do cliente até o momento em que a OS foi criada
        const mensagens = await prisma_1.prisma.mensagens.findMany({
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
exports.MensagemRepository = MensagemRepository;
