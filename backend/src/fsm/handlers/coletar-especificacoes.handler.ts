import { entityExtractionService } from '../../services/entity-extraction.service';
import { formatarPerguntaCatalogo } from '../catalog.util';
import { syncContextFromEntities } from '../context.util';
import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationContext, ConversationState, SessaoRecord } from '../states';
import { transitionService } from '../transition.service';
import { prepareContext } from './base.handler';

const TRANSITION_MSG =
  'Já anotei tudo! Vou processar seu orçamento e enviar para a nossa equipe aprovar no sistema. Assim que liberado, te passo o valor aqui mesmo, ok?';

function perguntaTamanhoPersonalizado(message: string): boolean {
  return /\b(maior|menor|só tem|so tem|apenas essas|outro tamanho|diferente|personalizad|customizad|algo maior|mais grande)\b/i.test(
    message
  );
}

export class ColetarEspecificacoesHandler implements StateHandler {
  async handle(
    message: string,
    sessao: SessaoRecord,
    deps: HandlerDeps
  ): Promise<HandlerResult> {
    const produtoTravado = sessao.contexto.produto;

    const produtoNaMensagem = entityExtractionService.identificarProdutoNaMensagem(message);
    if (produtoNaMensagem && produtoTravado && produtoNaMensagem.produto !== produtoTravado) {
      // Troca implícita de produto no meio da coleta — delega ao router na próxima volta;
      // aqui seguimos com o produto já travado até o intent capturar
    }

    const prepared = prepareContext(message, sessao, deps);
    const entities = prepared.entities;
    let context: ConversationContext = syncContextFromEntities(
      { ...sessao.contexto, produto: produtoTravado || sessao.contexto.produto },
      entities
    );

    if (!context.produto && entities.produtoIdentificado) {
      context.produto = entities.produtoIdentificado;
    }

    if (context.produto && entities.perguntasFaltantes.length > 0) {
      context.specsPendentes = entities.perguntasFaltantes;
    }

    if (perguntaTamanhoPersonalizado(message)) {
      return {
        response:
          'Sim, fazemos tamanhos personalizados! Me passa a largura e a altura em cm que você precisa (ex: 2,00 x 1,00m)?',
        nextState: ConversationState.COLETAR_ESPECIFICACOES,
        updatedContext: context,
      };
    }

    let nextState = transitionService.resolve(
      ConversationState.COLETAR_ESPECIFICACOES,
      message,
      context,
      entities
    );

    if (nextState === ConversationState.ESCLARECER_DUVIDA) {
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

    if (nextState === ConversationState.VALIDAR_ARQUIVO) {
      return {
        response: 'Você já tem o arquivo de arte pronto para enviar? Aceitamos PDF, JPG, PNG ou TIFF.',
        nextState: ConversationState.VALIDAR_ARQUIVO,
        updatedContext: context,
      };
    }

    if (nextState === ConversationState.CALCULAR_ORCAMENTO) {
      return {
        response: TRANSITION_MSG,
        nextState: ConversationState.CALCULAR_ORCAMENTO,
        updatedContext: context,
        chainNext: ConversationState.CALCULAR_ORCAMENTO,
      };
    }

    const pendentes = context.specsPendentes ?? entities.perguntasFaltantes;

    if (pendentes.length > 0) {
      return {
        response: formatarPerguntaCatalogo(pendentes[0]),
        nextState: ConversationState.COLETAR_ESPECIFICACOES,
        updatedContext: context,
      };
    }

    const ragResult = await deps.ragService.queryWithState(
      message,
      ConversationState.COLETAR_ESPECIFICACOES,
      context,
      deps.conversationHistory
    );

    return {
      response: ragResult.answer,
      nextState: ConversationState.COLETAR_ESPECIFICACOES,
      updatedContext: context,
    };
  }
}

export const coletarEspecificacoesHandler = new ColetarEspecificacoesHandler();
