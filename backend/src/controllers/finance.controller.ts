import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export class FinanceController {
  async getSummary(req: Request, res: Response) {
    try {
      const period = (req.query.period as string) || new Date().toISOString().substring(0, 7); // YYYY-MM
      const [year, month] = period.split('-').map(Number);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: 'Formato de período inválido. Use YYYY-MM.' });
      }

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      // Busca todas as ordens criadas no período selecionado
      const ordens = await prisma.ordensDeServico.findMany({
        where: {
          criadoEm: {
            gte: startDate,
            lt: endDate
          }
        }
      });

      let receitaTotal = 0;
      let recebido = 0;
      let aReceber = 0;

      ordens.forEach(os => {
        // Apenas consideramos financeiramente ordens que foram aprovadas ou além
        if (['APROVADO', 'EM_PRODUCAO', 'PRONTA_PARA_RETIRADA', 'ENTREGUE'].includes(os.status)) {
          const specs = os.especificacoes as any;
          if (specs && specs.orcamento && specs.orcamento.total !== undefined) {
            const total = Number(specs.orcamento.total) || 0;
            receitaTotal += total;

            if (['PRONTA_PARA_RETIRADA', 'ENTREGUE'].includes(os.status)) {
              recebido += total;
            } else {
              aReceber += total;
            }
          }
        }
      });

      const custos = receitaTotal * 0.40; // Custos operacionais estimados em 40%
      const margemLiquida = receitaTotal - custos;
      const margemPercentual = receitaTotal > 0 ? (margemLiquida / receitaTotal) * 100 : 0;

      // Monta os dados do gráfico para os últimos 6 meses (terminando no período selecionado)
      const grafico = [];
      const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(year, month - 1 - i, 1);
        const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);

        const mOrders = await prisma.ordensDeServico.findMany({
          where: {
            criadoEm: {
              gte: mStart,
              lt: mEnd
            }
          }
        });

        let mReceita = 0;
        mOrders.forEach(os => {
          if (['APROVADO', 'EM_PRODUCAO', 'PRONTA_PARA_RETIRADA', 'ENTREGUE'].includes(os.status)) {
            const specs = os.especificacoes as any;
            if (specs && specs.orcamento && specs.orcamento.total !== undefined) {
              mReceita += Number(specs.orcamento.total) || 0;
            }
          }
        });

        const mCusto = mReceita * 0.40;

        grafico.push({
          label: mesesNomes[d.getMonth()],
          receita: mReceita,
          custo: mCusto
        });
      }

      return res.json({
        receitaTotal,
        recebido,
        aReceber,
        custos,
        margemLiquida,
        margemPercentual,
        grafico
      });
    } catch (error) {
      console.error('❌ Erro ao buscar resumo financeiro:', error);
      return res.status(500).json({ error: 'Erro interno ao processar resumo financeiro.' });
    }
  }
}

export const financeController = new FinanceController();
