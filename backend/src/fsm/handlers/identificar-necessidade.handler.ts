import { entityExtractionService } from '../../services/entity-extraction.service';
import { formatarPerguntaCatalogo } from '../catalog.util';
import { syncContextFromEntities } from '../context.util';
import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationState, SessaoRecord } from '../states';
import { DUVIDA, transitionService } from '../transition.service';
import { prepareContext } from './base.handler';

const SAIDA_DUVIDA = /\b(entendi|obrigad|beleza|ok|vou de|vou com|fico com|prefiro)\b/i;

export class IdentificarNecessidadeHandler implements StateHandler {
  async handle(
    message: string,
    sessao: SessaoRecord,
    deps: HandlerDeps
  ): Promise<HandlerResult> {
    if (DUVIDA.test(message) && !SAIDA_DUVIDA.test(message)) {
      const { context } = prepareContext(message, sessao, deps);

      // Resposta vem do RAG com o prompt do estado ESCLARECER_DUVIDA — assim
      // a dúvida do cliente já é respondida no MESMO turno em que entra no
      // estado, evitando "ping-pong" (cliente pergunta, bot pede pra repetir).
      const ragResult = await deps.ragService.queryWithState(
        message,
        ConversationState.ESCLARECER_DUVIDA,
        context,
        deps.conversationHistory
      );

      return {
        response: ragResult.answer,
        nextState: ConversationState.ESCLARECER_DUVIDA,
        updatedContext: context,
      };
    }

    const produtoNaMensagem = entityExtractionService.identificarProdutoNaMensagem(message);

    if (produtoNaMensagem) {
      const entities = entityExtractionService.extract(deps.conversationHistory, {
        produtoAtual: produtoNaMensagem.produto,
      });
      const context = syncContextFromEntities(
        { produto: produtoNaMensagem.produto },
        entities
      );

      const pendentes = entities.perguntasFaltantes;
      const response = pendentes.length
        ? formatarPerguntaCatalogo(pendentes[0])
        : `Perfeito, vamos com ${produtoNaMensagem.produto}! Me conta o que você precisa.`;

      return {
        response,
        nextState: ConversationState.COLETAR_ESPECIFICACOES,
        updatedContext: context,
      };
    }

    const prepared = prepareContext(message, sessao, deps);
    const entities = prepared.entities;
    let context = prepared.context;

    let nextState = transitionService.resolve(
      ConversationState.IDENTIFICAR_NECESSIDADE,
      message,
      context,
      entities
    );

    if (entities.produtoIdentificado) {
      nextState = ConversationState.COLETAR_ESPECIFICACOES;
      context = syncContextFromEntities(
        { produto: entities.produtoIdentificado },
        entities
      );
      const pendentes = entities.perguntasFaltantes;
      if (pendentes.length) {
        return {
          response: formatarPerguntaCatalogo(pendentes[0]),
          nextState,
          updatedContext: context,
        };
      }
    }

    const ragResult = await deps.ragService.queryWithState(
      message,
      ConversationState.IDENTIFICAR_NECESSIDADE,
      context,
      deps.conversationHistory
    );

    return {
      response: ragResult.answer,
      nextState,
      updatedContext: context,
    };
  }
}

export const identificarNecessidadeHandler = new IdentificarNecessidadeHandler();
