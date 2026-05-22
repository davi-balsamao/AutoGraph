/**
 * Handler do estado CONFIRMAR_PEDIDO.
 *
 * Contrato ([rag-test/estados/confirmar-pedido.md]):
 *  • Listar TUDO: produto, specs, quantidade, valor total, prazo, entrega
 *  • Pergunta direta: "Confirma este pedido?"
 *  • NÃO gerar O.S. sem resposta afirmativa explícita do cliente (Regra 4 + 15)
 *  • Se cliente corrigir algo: voltar a COLETAR_ESPECIFICACOES
 *
 * Resumo é determinístico — montado a partir de `sessao.contexto`. Nada de RAG aqui:
 *  - reduz custo / latência
 *  - garante consistência com o que foi acordado
 *  - cumpre Regra 3 (sem invenção)
 */

import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationContext, ConversationState, SessaoRecord } from '../states';
import { prepareContext } from './base.handler';

const CONFIRMAR_RE = /\b(confirmo|confirmado|aprovo|aprovado|pode gerar|pode fazer|pode emitir|fechado|tá certo|esta certo|está certo|isso mesmo|isso ai|isso aí|combinado)\b/i;
const CORRIGIR_RE = /\b(errado|corrige|corrigir|trocar|mudar|alterar|n[ãa]o é isso|n[ãa]o é assim|refazer|outra coisa)\b/i;

function formatarMoeda(valor: number | undefined): string {
  if (!valor || valor <= 0) return 'a definir';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarSpecs(specs: Record<string, string> | undefined): string {
  if (!specs || Object.keys(specs).length === 0) return '— sem especificações detalhadas';
  return Object.entries(specs)
    .map(([pergunta, resposta]) => `   • ${pergunta.replace(/\?$/, '')}: ${resposta}`)
    .join('\n');
}

function formatarEntrega(entrega: ConversationContext['entrega']): string {
  if (!entrega?.modalidade) return 'a definir';
  if (entrega.modalidade === 'retirada') return 'Retirada na loja';
  return entrega.endereco
    ? `Entrega em: ${entrega.endereco}`
    : 'Entrega (endereço a confirmar)';
}

function montarResumo(context: ConversationContext): string {
  const produto = context.produto || 'Produto não identificado';
  const specs = formatarSpecs(context.specs);
  const total = formatarMoeda(context.orcamento?.total);
  const prazo = context.orcamento?.prazo || 'a definir';
  const entrega = formatarEntrega(context.entrega);

  return [
    'Vamos confirmar seu pedido:',
    `📦 *Produto*: ${produto}`,
    `📋 *Especificações*:\n${specs}`,
    `💰 *Valor total*: ${total}`,
    `⏱️ *Prazo de produção*: ${prazo}`,
    `🚚 *Entrega*: ${entrega}`,
    '',
    'Confirma este pedido?',
  ].join('\n');
}

export class ConfirmarPedidoHandler implements StateHandler {
  async handle(
    message: string,
    sessao: SessaoRecord,
    deps: HandlerDeps
  ): Promise<HandlerResult> {
    const { context } = await prepareContext(message, sessao, deps);
    console.log(`🔖 [CONFIRMAR_PEDIDO] osId in=${sessao.contexto.osId?.slice(0, 8) ?? 'null'} prepared=${context.osId?.slice(0, 8) ?? 'null'}`);

    // Mensagem vazia (entrada via chain de COLETAR_DADOS_ENTREGA → CONFIRMAR_PEDIDO):
    // emite o resumo e aguarda o "confirmo" no próximo turno.
    const msg = message.trim();
    if (!msg) {
      return {
        response: montarResumo(context),
        nextState: ConversationState.CONFIRMAR_PEDIDO,
        updatedContext: context,
      };
    }

    if (CONFIRMAR_RE.test(msg)) {
      return {
        response: '',
        nextState: ConversationState.GERAR_OS,
        updatedContext: context,
        chainNext: ConversationState.GERAR_OS,
      };
    }

    if (CORRIGIR_RE.test(msg)) {
      return {
        response: 'Sem problema! Me diga o que precisa ajustar e eu refaço o orçamento.',
        nextState: ConversationState.COLETAR_ESPECIFICACOES,
        updatedContext: context,
      };
    }

    // Cliente respondeu algo que não é confirmação nem correção — re-pergunta
    // com o resumo (mantém o foco, evita resposta livre que poderia inventar dado).
    return {
      response: montarResumo(context),
      nextState: ConversationState.CONFIRMAR_PEDIDO,
      updatedContext: context,
    };
  }
}

export const confirmarPedidoHandler = new ConfirmarPedidoHandler();
