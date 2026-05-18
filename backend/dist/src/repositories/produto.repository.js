"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProdutoRepository = void 0;
const prisma_1 = require("../config/prisma"); // Assumindo que a instância prisma é exportada de config/prisma.ts
class ProdutoRepository {
    async findAll() {
        return await prisma_1.prisma.produto.findMany({
            orderBy: { criadoEm: 'desc' }
        });
    }
    async findById(id) {
        return await prisma_1.prisma.produto.findUnique({
            where: { id }
        });
    }
    async create(data) {
        return await prisma_1.prisma.produto.create({
            data
        });
    }
    async update(id, data) {
        return await prisma_1.prisma.produto.update({
            where: { id },
            data
        });
    }
    async delete(id) {
        return await prisma_1.prisma.produto.delete({
            where: { id }
        });
    }
}
exports.ProdutoRepository = ProdutoRepository;
