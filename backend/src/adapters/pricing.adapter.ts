import { prisma } from '../config/prisma';

export interface OrcamentoInput {
  produtoNome: string;
  quantidade: number;
  acabamento?: string;
  specs?: any;
}

export class PricingReadAdapter {
  static async calcular(input: OrcamentoInput): Promise<number> {
    // 1. Busca produto real no banco
    const produtoDb = await prisma.produto.findFirst({
      where: { nome: { contains: input.produtoNome, mode: 'insensitive' } }
    });

    if (!produtoDb) throw new Error("Produto não encontrado no catálogo.");

    // 2. Regra de Negócio Determinística (Pipeline)
    // Exemplo: Preço baseado no precoBase definido no banco
    let precoFinal = produtoDb.precoBase * (input.quantidade / 100);

    // Regras de acabamento (Sem IA aqui, apenas lógica pura)
    if (input.acabamento?.toLowerCase() === 'fosco') precoFinal += 20.00;

    return precoFinal;
  }
}