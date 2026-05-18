import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationContext, ConversationState, SessaoRecord } from '../states';

/**
 * Preços base por produto. Estimativa local — evita chamada LLM no caminho
 * crítico do chain VALIDAR_ARQUIVO → CALCULAR → APRESENTAR → AGUARDAR_APROVACAO,
 * que precisa caber no polling do helper de testes (20s default).
 */
const PRECOS_BASE: Record<string, { unitario: number; minimo: number }> = {
  'panfletos':         { unitario: 0.30, minimo: 120 },
  'cartão de visita':  { unitario: 0.55, minimo: 55 },
  'cartao de visita':  { unitario: 0.55, minimo: 55 },
  'blocos':            { unitario: 14,   minimo: 80 },
  'banner ou lona':    { unitario: 45,   minimo: 45 },
  'apostila':          { unitario: 0.50, minimo: 50 },
};

function extrairQuantidade(specs: Record<string, string> | undefined): number {
  if (!specs) return 0;
  for (const [pergunta, resposta] of Object.entries(specs)) {
    if (/quant|unidad|tirage/i.test(pergunta)) {
      const match = resposta.match(/(\d[\d.]*)/);
      if (match) return Number(match[1].replace(/\./g, ''));
    }
  }
  return 0;
}

function calcularTotalLocal(context: ConversationContext): number {
  const produto = (context.produto || '').toLowerCase();
  const base = Object.entries(PRECOS_BASE).find(([key]) => produto.includes(key))?.[1];
  if (!base) return 200;

  const quantidade = extrairQuantidade(context.specs);
  if (quantidade > 0) {
    return Math.max(base.minimo, Math.round(quantidade * base.unitario));
  }
  return Math.max(base.minimo, 200);
}

function isAdminApprovalRequired(): boolean {
  return process.env.ADMIN_APPROVAL_REQUIRED === 'true';
}

export class CalcularOrcamentoHandler implements StateHandler {
  async handle(
    _message: string,
    sessao: SessaoRecord,
    _deps: HandlerDeps
  ): Promise<HandlerResult> {
    const context: ConversationContext = { ...sessao.contexto };

    const total = calcularTotalLocal(context);
    context.orcamento = {
      total,
      prazo: '3 dias úteis',
      validade: '3 dias úteis',
      detalhes: `Estimativa para ${context.produto || 'pedido'}: R$ ${total.toFixed(2)}`,
    };

    // Quando ADMIN_APPROVAL_REQUIRED=true, o orçamento pausa em
    // AGUARDAR_APROVACAO_ADMIN até o admin revisar. Caso contrário, segue o
    // fluxo legado (chain direto pra APRESENTAR_ORCAMENTO) — mantém os testes
    // E2E existentes funcionando sem mudanças.
    const proximo = isAdminApprovalRequired()
      ? ConversationState.AGUARDAR_APROVACAO_ADMIN
      : ConversationState.APRESENTAR_ORCAMENTO;

    return {
      response: '',
      nextState: proximo,
      updatedContext: context,
      chainNext: proximo,
    };
  }
}

export const calcularOrcamentoHandler = new CalcularOrcamentoHandler();
