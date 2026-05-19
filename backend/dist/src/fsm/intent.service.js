"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectSessionIntent = detectSessionIntent;
exports.mensagemNovoAtendimento = mensagemNovoAtendimento;
exports.mensagemTrocaProduto = mensagemTrocaProduto;
const entity_extraction_service_1 = require("../services/entity-extraction.service");
const states_1 = require("./states");
/**
 * Fase 3 — Migração híbrida regex → LLM.
 *
 * Regex permanece apenas como GUARD EARLY-EXIT para casos óbvios em que
 * disparar o LLM é desperdício (latência + custo). A decisão real é
 * delegada ao `EntityExtractionService` (que internamente usa o LLM).
 *
 * Compartilhamento de cache: o resultado é guardado pelo extractor, então
 * a chamada posterior do handler (via `prepareContext`) é hit de cache.
 */
const NOVO_ATENDIMENTO_OBVIO = /^(cancela tudo|esquece tudo|recome[çc]ar do zero|come[çc]ar de novo)\b/i;
const SAUDACAO_REINICIO = /^(oi|olá|ola|bom dia|boa tarde|boa noite|opa|e aí|eai)[\s,!.]*$/i;
/**
 * Despedida ou agradecimento final do cliente: depois de ENCERRAR só essas
 * frases mantêm a sessão fechada. Qualquer outra mensagem reabre.
 */
const DESPEDIDA_FINAL = /^(obrigad[oa]?|valeu|brigad[oa]?|at[ée] (logo|mais|depois|amanh[ãa])|tchau|tchauzinho|bye|fui|falou)\b/i;
const MENSAGEM_PROCESSO_ARQUIVO = /\b(pdf|jpg|png|psd|ai|cdr|exportar|salvar|camadas|achatadas|aguarda|aguardar|esperar|espera|reenviei|enviei|anexei|segue)\b/i;
const MENSAGEM_CURTA_CONFIRMACAO = /^(entendi|ok|beleza|fechado|perfeito|t[áa] bom|certo|sim|n[ãa]o|isso)[\s,!.]*$/i;
const ESTADOS_COM_FLUXO_AVANCADO = new Set([
    states_1.ConversationState.COLETAR_ESPECIFICACOES,
    states_1.ConversationState.VALIDAR_ARQUIVO,
    states_1.ConversationState.CALCULAR_ORCAMENTO,
    states_1.ConversationState.APRESENTAR_ORCAMENTO,
    states_1.ConversationState.AGUARDAR_APROVACAO,
    states_1.ConversationState.NEGOCIAR,
    states_1.ConversationState.COLETAR_DADOS_ENTREGA,
    states_1.ConversationState.CONFIRMAR_PEDIDO,
    states_1.ConversationState.PRODUTO_INDISPONIVEL,
]);
async function detectSessionIntent(message, estadoAtual, conversationHistory, produtoAtual) {
    const msg = message.trim();
    // Early-exit 0: sessão já em ENCERRAR. O cliente terminou um atendimento
    // anterior e está mandando mensagem nova — qualquer coisa que não seja
    // despedida/agradecimento explícito reabre o atendimento.
    if (estadoAtual === states_1.ConversationState.ENCERRAR) {
        return DESPEDIDA_FINAL.test(msg)
            ? { type: 'NONE' }
            : { type: 'NOVO_ATENDIMENTO' };
    }
    // Early-exit 1: padrão obvio de cancelamento.
    if (NOVO_ATENDIMENTO_OBVIO.test(msg)) {
        return { type: 'NOVO_ATENDIMENTO' };
    }
    // Early-exit 2: saudação isolada em estado avançado = reinício implícito.
    if (SAUDACAO_REINICIO.test(msg) && ESTADOS_COM_FLUXO_AVANCADO.has(estadoAtual)) {
        return { type: 'NOVO_ATENDIMENTO' };
    }
    // Early-exit 3: estados iniciais — NOVO_ATENDIMENTO/TROCAR_PRODUTO não fazem
    // sentido antes de um produto estar travado na sessão. Evita LLM desnecessário.
    if (!ESTADOS_COM_FLUXO_AVANCADO.has(estadoAtual)) {
        return { type: 'NONE' };
    }
    // Early-exit 4: mensagens de andamento do processo (arquivos) ou curtas concordâncias
    // claramente não são intenções de recomeçar ou trocar o produto.
    if (MENSAGEM_PROCESSO_ARQUIVO.test(msg) || MENSAGEM_CURTA_CONFIRMACAO.test(msg)) {
        return { type: 'NONE' };
    }
    // Caminho principal: LLM via EntityExtractionService (só para estados avançados).
    const entities = await entity_extraction_service_1.entityExtractionService.extract(conversationHistory, {
        produtoAtual: produtoAtual ?? null,
    });
    if (entities.intent === 'NOVO_ATENDIMENTO') {
        return { type: 'NOVO_ATENDIMENTO' };
    }
    if (entities.intent === 'TROCAR_PRODUTO') {
        return {
            type: 'TROCAR_PRODUTO',
            produtoIdentificado: entities.produtoIdentificado,
        };
    }
    // Caso clássico: cliente menciona produto válido enquanto está em estado avançado.
    // Não é mais reconhecido como NOVO_PEDIDO porque o cliente pode estar respondendo
    // a uma pergunta — só consideramos troca quando o LLM marcou explicitamente.
    return { type: 'NONE' };
}
function mensagemNovoAtendimento() {
    const h = new Date().getHours();
    const saudacao = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    return `${saudacao}! Sem problema, começamos do zero. Como posso te ajudar?`;
}
function mensagemTrocaProduto(produto) {
    if (produto) {
        return `Tranquilo! Vamos montar o orçamento de ${produto} do início. Você tem a arte pronta?`;
    }
    return 'Sem problema! Qual produto você quer orçar agora?';
}
