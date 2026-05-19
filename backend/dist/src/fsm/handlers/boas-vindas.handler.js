"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boasVindasHandler = exports.BoasVindasHandler = void 0;
const states_1 = require("../states");
const base_handler_1 = require("./base.handler");
const RECLAMACAO_HANDLER = /\b(reclamação|reclamacao|problema grave|processo|advogado|péssimo|pessimo|saiu errado|saiu completamente errado|errad[oa]s?|inaceit[aá]vel|inaceitaveis|diferente do que pedi|n[aã]o era isso|ficou errado|ficou diferente|incorret[oa]s?|insatisfeit[oa]|produto errado|qualidade p[eé]ssima)\b/i;
const HUMANO_HANDLER = /\b(atendente|humano|gerente|pessoa|falar com alguém|falar com alguem)\b/i;
// Fluxo 19: cliente abre a conversa pedindo para alterar/cancelar/trocar algo
// num pedido que JÁ foi confirmado/emitido — não podemos editar O.S. gerada,
// então escala imediatamente para humano. Exige os DOIS sinais (intenção de
// alteração + pedido já existente) para evitar falso-positivo num novo pedido.
const INTENCAO_ALTERACAO = /\b(alterar|alterando|altero|altere|trocar|trocando|troco|troquei|mudar|mudando|mudo|mude|modificar|modificando|modifico|modifique|cancelar|cancelando|cancelo|cancele)\b/i;
const CONTEXTO_POS_OS = /\b(confirma[çc][ãa]o|j[áa]\s+(?:confirmei|recebi|paguei|aprov|fechei|fiz\s+o\s+pedido)|recebi\s+(?:a|o)\s+(?:confirma|or[çc]amento|os|o\.s\.|pedido)|n[uú]mero\s+da\s+(?:o\.?s\.?|ordem)|minha\s+(?:o\.?s\.?|ordem)|os\s+emitida|o\.s\.?\s+emitida|pedido\s+(?:emitid|fechad|aprov|confirma)|orçamento\s+aprovado|orcamento\s+aprovado)\b/i;
function saudacaoPorHorario() {
    const h = new Date().getHours();
    if (h < 12)
        return 'Bom dia';
    if (h < 18)
        return 'Boa tarde';
    return 'Boa noite';
}
class BoasVindasHandler {
    async handle(message, sessao, _deps) {
        const saudacao = saudacaoPorHorario();
        const msg = message.toLowerCase();
        const clientePerguntouComoVai = /\b(tudo bem|como vai|como está|como esta|beleza)\b/.test(msg);
        // Escalada imediata: reclamação ou pedido de humano já na abertura
        if (RECLAMACAO_HANDLER.test(msg) || HUMANO_HANDLER.test(msg)) {
            return {
                response: '',
                nextState: states_1.ConversationState.ESCALAR_HUMANO,
                updatedContext: { ...sessao.contexto },
                chainNext: states_1.ConversationState.ESCALAR_HUMANO,
            };
        }
        // Fluxo 19: pedido de alteração/cancelamento sobre pedido já emitido. O bot
        // não edita O.S. gerada — escala direto. Precisa dos dois sinais juntos
        // (intenção + contexto pós-OS) para não pegar mudanças durante a coleta.
        if (INTENCAO_ALTERACAO.test(msg) && CONTEXTO_POS_OS.test(msg)) {
            return {
                response: '',
                nextState: states_1.ConversationState.ESCALAR_HUMANO,
                updatedContext: { ...sessao.contexto },
                chainNext: states_1.ConversationState.ESCALAR_HUMANO,
            };
        }
        // Fluxo 20: cliente abre com mensagem totalmente fora do escopo (piada,
        // receita, futebol...). Redireciona com firmeza ao tema e avança para
        // COLETAR_ESPECIFICACOES, esperando que o cliente liste o produto.
        if ((0, base_handler_1.isOffTopicMessage)(message)) {
            const offTopicCount = (sessao.contexto.offTopicCount || 0) + 1;
            return {
                response: 'Oi! Aqui é o atendimento da gráfica AutoGraph. Conseguimos te ajudar só com pedidos de impressão (panfletos, cartão de visita, banner, blocos ou apostilas). Qual produto você precisa?',
                nextState: states_1.ConversationState.COLETAR_ESPECIFICACOES,
                updatedContext: { ...sessao.contexto, offTopicCount },
            };
        }
        const complemento = clientePerguntouComoVai ? ' Tudo bem e voce?' : '';
        const response = `${saudacao},${complemento} A AutoGraph agradece o seu contato! Como posso te ajudar?`;
        return {
            response,
            nextState: states_1.ConversationState.IDENTIFICAR_NECESSIDADE,
            updatedContext: { ...sessao.contexto },
        };
    }
}
exports.BoasVindasHandler = BoasVindasHandler;
exports.boasVindasHandler = new BoasVindasHandler();
