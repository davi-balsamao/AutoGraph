import { entityExtractionService } from '../../services/entity-extraction.service';
import { syncContextFromEntities } from '../context.util';
import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationState, SessaoRecord } from '../states';
import { transitionService } from '../transition.service';

const TRANSITION_MSG =
  'Já anotei tudo! Vou processar seu orçamento e enviar para a nossa equipe aprovar no sistema. Assim que liberado, te passo o valor aqui mesmo, ok?';

function parseEntrega(message: string, context: HandlerResult['updatedContext']) {
  const msg = message.toLowerCase();
  const entrega = { ...context.entrega };
  if (/\bretirad/.test(msg)) {
    entrega.modalidade = 'retirada';
  } else if (/\bentreg/.test(msg)) {
    entrega.modalidade = 'entrega';
    entrega.endereco = message.trim();
  }
  return { ...context, entrega };
}

export class GenericStateHandler implements StateHandler {
  constructor(private readonly state: ConversationState) {}

  async handle(
    message: string,
    sessao: SessaoRecord,
    deps: HandlerDeps
  ): Promise<HandlerResult> {
    const currentState = this.state;
    let context = { ...sessao.contexto };

    const historyForExtraction = deps.conversationHistory
      ? `${deps.conversationHistory}\nCliente: ${message}`
      : `Cliente: ${message}`;

    const entities = entityExtractionService.extract(historyForExtraction, {
      produtoAtual: context.produto ?? sessao.contexto.produto,
    });
    context = syncContextFromEntities(context, entities);

    if (currentState === ConversationState.COLETAR_DADOS_ENTREGA) {
      context = parseEntrega(message, context);
    }

    if (currentState === ConversationState.VALIDAR_ARQUIVO && /\b(sim|ok|certo|pode)\b/i.test(message)) {
      context.validacaoArteOk = true;
    }

    let nextState = transitionService.resolve(currentState, message, context, entities);

    if (
      transitionService.shouldPushPreviousState(currentState, nextState) &&
      currentState !== ConversationState.ESCLARECER_DUVIDA
    ) {
      // estadoAnterior gravado pelo router
    }

    if (
      currentState === ConversationState.ESCLARECER_DUVIDA &&
      /\b(obrigad|entendi|ok|beleza)\b/i.test(message.toLowerCase())
    ) {
      nextState = transitionService.restorePreviousState(sessao.estadoAnterior);
    }

    if (
      nextState === ConversationState.GERAR_OS &&
      currentState !== ConversationState.GERAR_OS
    ) {
      return {
        response: 'Perfeito! Vou registrar seu pedido agora.',
        nextState: ConversationState.GERAR_OS,
        updatedContext: context,
        chainNext: ConversationState.GERAR_OS,
      };
    }

    if (nextState === ConversationState.ESCALAR_HUMANO) {
      return {
        response:
          'Entendi. Vou chamar um atendente da nossa equipe para te ajudar pessoalmente. Um momento!',
        nextState: ConversationState.ESCALAR_HUMANO,
        updatedContext: context,
        escalarHumano: true,
      };
    }

    if (nextState === ConversationState.CALCULAR_ORCAMENTO && currentState !== ConversationState.CALCULAR_ORCAMENTO) {
      return {
        response: TRANSITION_MSG,
        nextState: ConversationState.CALCULAR_ORCAMENTO,
        updatedContext: context,
        chainNext: ConversationState.CALCULAR_ORCAMENTO,
      };
    }

    const ragResult = await deps.ragService.queryWithState(
      message,
      currentState,
      context,
      deps.conversationHistory || undefined
    );

    let response = ragResult.answer;

    if (nextState === currentState && currentState === ConversationState.AGUARDAR_APROVACAO) {
      nextState = transitionService.resolve(
        ConversationState.AGUARDAR_APROVACAO,
        message,
        context,
        entities
      );
    }

    return {
      response,
      nextState,
      updatedContext: context,
    };
  }
}

export function createGenericHandler(state: ConversationState): StateHandler {
  return new GenericStateHandler(state);
}
