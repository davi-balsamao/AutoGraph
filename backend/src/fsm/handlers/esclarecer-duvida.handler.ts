import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationContext, ConversationState, SessaoRecord } from '../states';
import { transitionService } from '../transition.service';
import { prepareContext } from './base.handler';

/**
 * Detecta se a mensagem ainda contém uma pergunta — '?' ou palavras
 * interrogativas. Enquanto cliente perguntar, fica no estado.
 */
const IS_QUESTION =
  /\?|(\b(qual|quais|como|o que|por que|pra que|quando|quanto|tem|existe|há|vocês fazem|dá pra|pode ser)\b)/i;

/**
 * Detecta sinal de progresso: cliente quer prosseguir, sem fazer nova pergunta.
 * Inclui formas curtas ("ok", "vou de X") e longas ("então prefiro").
 */
const MOVING_FORWARD =
  /\b(então|entendi|obrigad|ok|beleza|certo|perfeito|combinado|fechado|vou de|vou com|vou nos|fico com|prefiro|escolho|gosto de|pode fazer|enviei|reenviei|mandei|anexei|segue|pronto|pronta|sim)\b/i;

/**
 * Handler do estado ESCLARECER_DUVIDA — o estado mais maleável da FSM.
 *
 * Contrato:
 *  • Cliente pode perguntar QUALQUER COISA relacionada à gráfica a qualquer momento.
 *  • Resposta vem EXCLUSIVAMENTE do RAG + base de conhecimento (guardrails embutidos).
 *  • Não calcula nem apresenta orçamento — isso é responsabilidade dos estados
 *    CALCULAR_ORCAMENTO e APRESENTAR_ORCAMENTO.
 *  • Não responde fora do escopo da gráfica — guardrails bloqueiam automaticamente.
 *  • Estado de retomada é `sessao.estadoAnterior`, registrado pelo state-router
 *    na entrada (via `transitionService.shouldPushPreviousState`).
 *
 * Lógica de transição:
 *  • PERMANECE se a mensagem é uma pergunta (cliente ainda em dúvida).
 *  • SAI quando o cliente sinaliza avanço sem perguntar — retorna ao estado
 *    anterior. Promove IDENTIFICAR_NECESSIDADE → COLETAR_ESPECIFICACOES quando
 *    já há produto identificado no contexto/histórico.
 */
export class EsclarecerDuvidaHandler implements StateHandler {
  async handle(
    message: string,
    sessao: SessaoRecord,
    deps: HandlerDeps
  ): Promise<HandlerResult> {
    const prepared = await prepareContext(message, sessao, deps);
    const entities = prepared.entities;
    const context: ConversationContext = prepared.context;

    // Resposta vem SEMPRE da knowledge base — guardrails filtram off-scope
    // e bloqueiam preços não autorizados.
    const ragResult = await deps.ragService.queryWithState(
      message,
      ConversationState.ESCLARECER_DUVIDA,
      context,
      deps.conversationHistory || undefined
    );

    const isQuestion = IS_QUESTION.test(message);
    const PAUSA_OU_FORMATO = /\b(exportar|pdf|jpg|png|tiff|formato|extensão|extensao|aguardar|esperar|salvar)\b/i;
    const SUBMISSION_RE = /\b(enviei|reenviei|mandei|anexei|segue)\b/i;
    const movingForward =
      MOVING_FORWARD.test(message) &&
      (SUBMISSION_RE.test(message) || !PAUSA_OU_FORMATO.test(message));

    // SAÍDA: progresso explícito sem nova pergunta.
    if (movingForward && !isQuestion) {
      const estadoRetomar = transitionService.restorePreviousState(
        sessao.estadoAnterior
      );
      const hasProduto = !!(context.produto || entities.produtoIdentificado);

      // Promove o fluxo: produto já conhecido → pula da identificação direto
      // pra coleta de specs, não regride.
      const nextState =
        hasProduto && estadoRetomar === ConversationState.IDENTIFICAR_NECESSIDADE
          ? ConversationState.COLETAR_ESPECIFICACOES
          : estadoRetomar;

      return {
        response: '',
        nextState,
        updatedContext: context,
        chainNext: nextState,
      };
    }

    // PERMANÊNCIA: ainda em dúvida, RAG continua respondendo.
    return {
      response: ragResult.answer,
      nextState: ConversationState.ESCLARECER_DUVIDA,
      updatedContext: context,
    };
  }
}

export const esclarecerDuvidaHandler = new EsclarecerDuvidaHandler();
