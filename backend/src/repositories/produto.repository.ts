import { PrismaClient, Produto } from '@prisma/client';
import { prisma } from '../config/prisma'; // Assumindo que a instância prisma é exportada de config/prisma.ts

export class ProdutoRepository {
  async findAll(): Promise<Produto[]> {
    return await prisma.produto.findMany({
      orderBy: { criadoEm: 'desc' }
    });
  }

  async findById(id: string): Promise<Produto | null> {
    return await prisma.produto.findUnique({
      where: { id }
    });
  }

  async create(data: { nome: string; descricao?: string; imagemUrl?: string; precoBase: number }): Promise<Produto> {
    return await prisma.produto.create({
      data
    });
  }

  async update(id: string, data: { nome?: string; descricao?: string; imagemUrl?: string; precoBase?: number }): Promise<Produto> {
    return await prisma.produto.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<Produto> {
    return await prisma.produto.delete({
      where: { id }
    });
  }
}
