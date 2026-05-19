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
const IS_QUESTION = /\?|(\b(qual|quais|como|o que|por que|pra que|quando|quanto|existe|há|vocês fazem|dá pra|vocês têm|vocês tem|voces tem)\b)/i;
/**
 * Detecta sinal de progresso: cliente quer prosseguir, sem fazer nova pergunta.
 * Inclui formas curtas ("ok", "vou de X") e longas ("então prefiro").
 */
const MOVING_FORWARD = /\b(então|entendi|obrigad|ok|beleza|certo|perfeito|combinado|fechado|vou de|vou com|vou nos|fico com|prefiro|escolho|gosto de|pode fazer|enviei|reenviei|mandei|anexei|segue|pronto|pronta|sim|pode ser)\b/i;
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
class EsclarecerDuvidaHandler {
    async handle(message, sessao, deps) {
        const baseContext = (0, states_1.parseContext)(sessao.contexto);
        const entities = entity_extraction_service_1.entityExtractionService.extractRegex(deps.conversationHistory || `Cliente: ${message}`, { produtoAtual: sessao.contexto.produto });
        // Preserva o produto/specs inferidos pela regex no contexto que será
        // propagado adiante — sem isso, o chain para COLETAR_ESPECIFICACOES
        // recebe contexto vazio e a FSM acaba pulando para CALCULAR_ORCAMENTO.
        const context = (0, context_util_1.syncContextFromEntities)(baseContext, entities);
        // Resposta vem SEMPRE da knowledge base — guardrails filtram off-scope
        // e bloqueiam preços não autorizados.
        const ragResult = await deps.ragService.queryWithState(message, states_1.ConversationState.ESCLARECER_DUVIDA, context, deps.conversationHistory || undefined);
        const isQuestion = IS_QUESTION.test(message) || transition_service_1.DUVIDA.test(message);
        const PAUSA_OU_FORMATO = /\b(exportar|pdf|jpg|png|tiff|formato|extensão|extensao|aguardar|esperar|salvar)\b/i;
        const SUBMISSION_RE = /\b(enviei|reenviei|mandei|anexei|segue)\b/i;
        const movingForward = MOVING_FORWARD.test(message) &&
            (SUBMISSION_RE.test(message) || !PAUSA_OU_FORMATO.test(message));
        // SAÍDA: progresso explícito, ou mensagem não é uma pergunta.
        // Isso evita prender o usuário se ele responder uma especificação (ex: "frente e verso", "100 paginas")
        if (movingForward || !isQuestion) {
            const estadoRetomar = transition_service_1.transitionService.restorePreviousState(sessao.estadoAnterior);
            const hasProduto = !!(context.produto || entities.produtoIdentificado);
            // Promove o fluxo: produto já conhecido → pula da identificação direto
            // pra coleta de specs, não regride.
            const nextState = hasProduto && estadoRetomar === states_1.ConversationState.IDENTIFICAR_NECESSIDADE
                ? states_1.ConversationState.COLETAR_ESPECIFICACOES
                : estadoRetomar;
            // Chain pra que o handler de destino processe a mesma mensagem
            // (ex.: "Sim, tenho a arte" em VALIDAR_ARQUIVO encadeia CALCULAR → APRESENTAR).
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
            nextState: states_1.ConversationState.ESCLARECER_DUVIDA,
            updatedContext: context,
        };
    }
}
exports.EsclarecerDuvidaHandler = EsclarecerDuvidaHandler;
exports.esclarecerDuvidaHandler = new EsclarecerDuvidaHandler();
