import { OsRepository } from '../../repositories/os.repository';
import { ragService } from '../../services/rag.service';
import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationContext, ConversationState, SessaoRecord } from '../states';

const osRepo = new OsRepository();

export class GerarOsHandler implements StateHandler {
  async handle(
    message: string,
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

    const mensagemSugerida = await ragService.generateSuggestedMessage(
      deps.clienteNome,
      especificacoes,
      deps.conversationHistory
    );

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
