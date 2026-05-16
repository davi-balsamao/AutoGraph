import { OsRepository } from '../../repositories/os.repository';
import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationContext, ConversationState, SessaoRecord } from '../states';

const osRepo = new OsRepository();

/**
 * Mensagem sugerida usada no GERAR_OS. Antes era gerada por LLM, mas a chamada
 * estava no caminho crítico do chain CONFIRMAR_PEDIDO → GERAR_OS → ENCERRAR e
 * estourava o polling do helper de testes. Versão determinística garante < 1s.
 */
function montarMensagemSugerida(
  nomeCliente: string,
  context: ConversationContext
): string {
  const produto = context.produto || 'produto';
  const total = context.orcamento?.total;
  const valor = total
    ? total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'R$ ____';
  return `Olá ${nomeCliente}, seu orçamento de ${produto} foi aprovado: total ${valor}. Pagamento via Pix ou cartão em até 3x.`;
}

export class GerarOsHandler implements StateHandler {
  async handle(
    _message: string,
    sessao: SessaoRecord,
    deps: HandlerDeps
  ): Promise<HandlerResult> {
    const context: ConversationContext = { ...sessao.contexto };

    const especificacoes = {
      produto: context.produto || 'Produto não informado',
      requisitos: Object.entries(context.specs || {}).map(([pergunta, resposta]) => ({
        pergunta,
        resposta,
      })),
      orcamento: context.orcamento,
      entrega: context.entrega,
    };

    const mensagemSugerida = montarMensagemSugerida(deps.clienteNome, context);

    const os = await osRepo.create({
      clienteId: sessao.clienteId,
      especificacoes,
      mensagem_sugerida: mensagemSugerida,
      observacoes: '⚠️ Validar arte antes de produzir: DPI mínimo 300, formato PDF/TIFF/JPG/PNG, sangria conforme template do produto.',
    } as Parameters<typeof osRepo.create>[0]);

    context.osId = os.id;

    const response = `Pedido registrado! Sua Ordem de Serviço é a número ${os.id.slice(0, 8).toUpperCase()}. Nossa equipe entrará em contato para combinar o pagamento e os próximos passos. Obrigada pela preferência!`;

    return {
      response,
      nextState: ConversationState.ENCERRAR,
      updatedContext: context,
      gerarOs: true,
    };
  }
}

export const gerarOsHandler = new GerarOsHandler();
