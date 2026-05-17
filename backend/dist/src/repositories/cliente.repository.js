"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClienteRepository = void 0;
const prisma_1 = require("../config/prisma");
class ClienteRepository {
    async findByPhone(telefone) {
        return prisma_1.prisma.usuario.findFirst({ where: { telefone } });
    }
    async findById(id) {
        return prisma_1.prisma.usuario.findUnique({
            where: { id },
        });
    }
    async updateAtendimentoStatus(id, status) {
        return prisma_1.prisma.usuario.update({
            where: { id },
            data: { atendimentoHumano: status },
        });
    }
    async create(data) {
        return prisma_1.prisma.usuario.create({
            data: {
                nome: data.nome,
                telefone: data.telefone,
                role: 'CLIENTE',
            },
        });
    }
}
exports.ClienteRepository = ClienteRepository;
