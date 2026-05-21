"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.esclarecerDuvidaHandler = exports.EsclarecerDuvidaHandler = void 0;
const entity_extraction_service_1 = require("../../services/entity-extraction.service");
const context_util_1 = require("../context.util");
const states_1 = require("../states");
const transition_service_1 = require("../transition.service");
/**
 * Detecta se a mensagem ainda contém uma pergunta — '?' ou palavras
 * interrogativas. Enquanto cliente perguntar, fica no estado.
 */
const IS_QUESTION = /\?|(\b(qual|quais|como|o que|por que|pra que|quando|quanto|existe|há|ha|vocês fazem|voces fazem|dá pra|da pra|vocês têm|vocês tem|voces tem)\b)/i;
/**
 * Detecta sinal de progresso: cliente quer prosseguir, sem fazer nova pergunta.
 * Inclui formas curtas ("ok", "vou de X") e longas ("então prefiro").
 */
const MOVING_FORWARD = /\b(então|entao|entendi|obrigad|ok|beleza|certo|perfeito|combinado|fechado|vou de|vou com|vou nos|fico com|prefiro|escolho|gosto de|pode fazer|enviei|reenviei|mandei|anexei|segue|pronto|pronta|sim|pode ser)\b/i;
/**
 * Detecta mensagens sobre arquivo/formato que devem ser processadas pelo estado
 * VALIDAR_ARQUIVO quando esse for o estado anterior.
 */
const ARQUIVO_OU_FORMATO = /\b(exportar|pdf|jpg|jpeg|png|tiff|formato|extensão|extensao|salvar|arquivo|arte|psd|ai|cdr|corel|photoshop|illustrator)\b/i;
const SUBMISSION_RE = /\b(enviei|reenviei|mandei|anexei|segue)\b/i;
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
 *  • PERMANECE se a mensagem é uma pergunta.
 *  • SAI quando o cliente sinaliza avanço sem perguntar — retorna ao estado
 *    anterior. Promove IDENTIFICAR_NECESSIDADE → COLETAR_ESPECIFICACOES quando
 *    já há produto identificado no contexto/histórico.
 */
class EsclarecerDuvidaHandler {
    async handle(message, sessao, deps) {
        const baseContext = (0, states_1.parseContext)(sessao.contexto);
        const entities = entity_extraction_service_1.entityExtractionService.extractRegex(deps.conversationHistory || `Cliente: ${message}`, { produtoAtual: baseContext.produto || sessao.contexto.produto });
        // Preserva o produto/specs inferidos pela regex no contexto que será
        // propagado adiante.
        const context = (0, context_util_1.syncContextFromEntities)(baseContext, entities);
        const estadoRetomar = transition_service_1.transitionService.restorePreviousState(sessao.estadoAnterior);
        const isQuestion = IS_QUESTION.test(message) || transition_service_1.DUVIDA.test(message);
        const movingForward = MOVING_FORWARD.test(message) &&
            (SUBMISSION_RE.test(message) || !ARQUIVO_OU_FORMATO.test(message));
        /**
         * Caso especial:
         * Se o usuário estava em VALIDAR_ARQUIVO e perguntou sobre formato/arquivo,
         * o RAG responde. Porém, se depois ele disser algo como "Entendi. Tenho em PDF",
         * precisamos devolver a mesma mensagem para VALIDAR_ARQUIVO processar,
         * em vez de permanecer preso em ESCLARECER_DUVIDA.
         */
        const shouldReturnToFileValidation = estadoRetomar === states_1.ConversationState.VALIDAR_ARQUIVO &&
            !isQuestion &&
            (MOVING_FORWARD.test(message) || ARQUIVO_OU_FORMATO.test(message));
        // SAÍDA: progresso explícito, mensagem não-pergunta, ou retorno para validar arquivo.
        if (movingForward || shouldReturnToFileValidation || !isQuestion) {
            const hasProduto = !!(context.produto || entities.produtoIdentificado);
            // Produto já conhecido → pula da identificação direto para coleta de specs.
            const nextState = hasProduto && estadoRetomar === states_1.ConversationState.IDENTIFICAR_NECESSIDADE
                ? states_1.ConversationState.COLETAR_ESPECIFICACOES
                : estadoRetomar;
            return {
                response: '',
                nextState,
                updatedContext: context,
                chainNext: nextState,
            };
        }
        // PERMANÊNCIA: ainda em dúvida, RAG continua respondendo.
        const ragResult = await deps.ragService.queryWithState(message, states_1.ConversationState.ESCLARECER_DUVIDA, context, deps.conversationHistory || undefined);
        return {
            response: ragResult.answer,
            nextState: states_1.ConversationState.ESCLARECER_DUVIDA,
            updatedContext: context,
        };
    }
}
exports.EsclarecerDuvidaHandler = EsclarecerDuvidaHandler;
exports.esclarecerDuvidaHandler = new EsclarecerDuvidaHandler();
