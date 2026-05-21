"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transitionService = exports.TransitionService = exports.DUVIDA = void 0;
const states_1 = require("./states");
const context_util_1 = require("./context.util");
const SAUDACOES = /^(oi|olá|ola|bom dia|boa tarde|boa noite|tudo bem|e aí|eai)(?:\b|\s|[?!.,]|$)/i;
const APROVACAO = /\b(aceito|aprovo|aprovado|pode ser|fechado|confirmo|sim|ok|beleza|combinado|vamos)(?:\b|\s|[?!.,]|$)/i;
const RECUSA = /\b(não quero|nao quero|desisto|cancela|cancelar|não vou|nao vou|recuso|vou pensar|vou passar|por enquanto não|por enquanto nao|não vou fechar|nao vou fechar|só comparar|so comparar|talvez retorne|não por agora|nao por agora)(?:\b|\s|[?!.,]|$)/i;
const NEGOCIACAO = /\b(caro|caro demais|desconto|mais barato|abaixa|concorrente|negociar)(?:\b|\s|[?!.,]|$)/i;
// Fase 5: ampliado para incluir perguntas de preço/orçamento. Cliente que pergunta
// "quanto custa" antes de fornecer specs é tratado como dúvida — o bot redireciona
// via ESCLARECER_DUVIDA explicando que precisa de mais info antes de calcular
// (alinhado com Regras 3 e 10 das regras-gerais.md).
// Nota: "orçamento" sozinho NÃO é dúvida (ex.: "pode calcular o orçamento" é
// instrução redundante, não pergunta). Só captura quando vier com semântica de
// pergunta ("qual o orçamento", "sobre o orçamento", "dúvida sobre o orçamento").
// Regex amplo de dúvida: cobre perguntas sobre processo, preço, catálogo
// aberto e pedidos de recomendação. Reflete intenções que devem desviar para
// ESCLARECER_DUVIDA (RAG + base de conhecimento) em vez de tentar processar
// como resposta do estado atual.
exports.DUVIDA = /\b(d[úu]vida|como funciona|o que [eé]|qual a diferen[çc]a|qual.{0,20}diferen[çc]a|diferen[çc]a (entre|t[ée]cnica)|explica|n[ãa]o entendi|n[ãa]o sei se|pre[çc]o|quanto custa|quanto fica|qual o valor|qual valor|qual o or[çc]amento|preciso saber o pre[çc]o|preciso saber|qual o custo|qual custo|quais produtos?|que produtos?|voc[êe]s fazem|voc[êe]s t[êe]m|voc[êe]s trabalham|trabalham com|fazem o qu[êe]|que tipo de|tipos de|recomenda|sugere|sugest[ãa]o|me indica|me ajuda a escolher|qual o melhor|qual a melhor|qual o ideal|qual ideal|o que voc[êe] acha|o que voc[êe]s acham|vale mais a pena)(?:\b|\s|[?!.,]|$)/i;
const RECLAMACAO = /\b(reclamação|reclamacao|problema grave|processo|advogado|péssimo|pessimo|saiu errado|saiu completamente errado|errad[oa]s?|inaceit[aá]vel|inaceitaveis|diferente do que pedi|n[aã]o era isso|ficou errado|ficou diferente|incorret[oa]s?|insatisfeit[oa]|produto errado|qualidade p[eé]ssima)(?:\b|\s|[?!.,]|$)/i;
const ARTE_OK = /\b(enviei|mandei|anexei|segue a arte|arquivo ok|está certo|esta certo|pode usar)(?:\b|\s|[?!.,]|$)/i;
const ENTREGA = /\b(entrega|entregar|retirada|retirar|buscar|endereço|endereco|rua|avenida|av\.|cep)(?:\b|\s|[?!.,]|$)/i;
const CONFIRMACAO_PEDIDO = /\b(confirmo|confirmado|está certo|esta certo|pode gerar|pode fazer)(?:\b|\s|[?!.,]|$)/i;
const HUMANO = /\b(atendente|humano|gerente|pessoa|falar com alguém|falar com alguem)(?:\b|\s|[?!.,]|$)/i;
class TransitionService {
    resolve(current, message, context, entities) {
        const msg = message.toLowerCase().trim();
        if (HUMANO.test(msg)) {
            return states_1.ConversationState.ESCALAR_HUMANO;
        }
        switch (current) {
            case states_1.ConversationState.BOAS_VINDAS:
                if (RECLAMACAO.test(msg))
                    return states_1.ConversationState.ESCALAR_HUMANO;
                return states_1.ConversationState.IDENTIFICAR_NECESSIDADE;
            case states_1.ConversationState.IDENTIFICAR_NECESSIDADE:
                if (RECLAMACAO.test(msg))
                    return states_1.ConversationState.ESCALAR_HUMANO;
                if (exports.DUVIDA.test(msg) && !entities.produtoIdentificado) {
                    return states_1.ConversationState.ESCLARECER_DUVIDA;
                }
                if (entities.produtoDesconhecido) {
                    return states_1.ConversationState.PRODUTO_INDISPONIVEL;
                }
                if (entities.produtoIdentificado) {
                    return states_1.ConversationState.COLETAR_ESPECIFICACOES;
                }
                return current;
            case states_1.ConversationState.COLETAR_ESPECIFICACOES:
                if (exports.DUVIDA.test(msg))
                    return states_1.ConversationState.ESCLARECER_DUVIDA;
                // Sem produto no contexto, fica coletando — nunca avança para
                // CALCULAR_ORCAMENTO sem ter o que orçar. Protege contra chains que
                // entram aqui com contexto vazio (ex: vindo de ESCLARECER_DUVIDA).
                if (!context.produto)
                    return current;
                if (!(0, context_util_1.specsCompletas)(context))
                    return current;
                if ((0, context_util_1.produtoExigeValidacaoArte)(context)) {
                    return states_1.ConversationState.VALIDAR_ARQUIVO;
                }
                return states_1.ConversationState.CALCULAR_ORCAMENTO;
            case states_1.ConversationState.VALIDAR_ARQUIVO:
                if (ARTE_OK.test(msg) || /\bsim\b/.test(msg)) {
                    return states_1.ConversationState.CALCULAR_ORCAMENTO;
                }
                return current;
            case states_1.ConversationState.CALCULAR_ORCAMENTO:
                // Quando aprovação admin é exigida, o chain do handler manda para
                // AGUARDAR_APROVACAO_ADMIN; caso contrário segue direto para
                // APRESENTAR_ORCAMENTO. A FSM aqui só cobre a transição síncrona —
                // o handler decide o nextState efetivo.
                return states_1.ConversationState.APRESENTAR_ORCAMENTO;
            case states_1.ConversationState.AGUARDAR_APROVACAO_ADMIN:
                // Preso até admin agir via API. Mensagens do cliente são tratadas
                // pelo handler (envia "estou revisando" 1x e depois silencia).
                return current;
            case states_1.ConversationState.APRESENTAR_ORCAMENTO:
                return states_1.ConversationState.AGUARDAR_APROVACAO;
            case states_1.ConversationState.AGUARDAR_APROVACAO:
                if (RECUSA.test(msg))
                    return states_1.ConversationState.ENCERRAR;
                if (APROVACAO.test(msg))
                    return states_1.ConversationState.COLETAR_DADOS_ENTREGA;
                if (NEGOCIACAO.test(msg))
                    return states_1.ConversationState.NEGOCIAR;
                if (exports.DUVIDA.test(msg)) {
                    if (context.orcamento && (msg.includes('calcular') || msg.includes('calcula') || msg.includes('faz o') || msg.includes('pode fazer') || msg.includes('gera o'))) {
                        return current;
                    }
                    return states_1.ConversationState.ESCLARECER_DUVIDA;
                }
                return current;
            case states_1.ConversationState.NEGOCIAR:
                if (RECUSA.test(msg))
                    return states_1.ConversationState.ENCERRAR;
                if (APROVACAO.test(msg))
                    return states_1.ConversationState.COLETAR_DADOS_ENTREGA;
                return current;
            case states_1.ConversationState.COLETAR_DADOS_ENTREGA:
                if (ENTREGA.test(msg) || context.entrega?.modalidade) {
                    return states_1.ConversationState.CONFIRMAR_PEDIDO;
                }
                return current;
            case states_1.ConversationState.CONFIRMAR_PEDIDO:
                if (CONFIRMACAO_PEDIDO.test(msg) || APROVACAO.test(msg)) {
                    return states_1.ConversationState.GERAR_OS;
                }
                return current;
            case states_1.ConversationState.GERAR_OS:
                return states_1.ConversationState.ENCERRAR;
            case states_1.ConversationState.ESCLARECER_DUVIDA:
                if (APROVACAO.test(msg) || /\b(obrigad|entendi|ok)\b/.test(msg)) {
                    return states_1.ConversationState.IDENTIFICAR_NECESSIDADE;
                }
                return current;
            case states_1.ConversationState.PRODUTO_INDISPONIVEL:
                if (entities.produtoIdentificado) {
                    return states_1.ConversationState.COLETAR_ESPECIFICACOES;
                }
                return current;
            case states_1.ConversationState.ESCALAR_HUMANO:
                return current;
            case states_1.ConversationState.AGUARDAR_RETORNO:
                if (msg.length > 0 && !SAUDACOES.test(msg)) {
                    return states_1.ConversationState.IDENTIFICAR_NECESSIDADE;
                }
                return current;
            case states_1.ConversationState.ENCERRAR:
                return current;
            default:
                return current;
        }
    }
    shouldPushPreviousState(from, to) {
        return (to === states_1.ConversationState.ESCLARECER_DUVIDA &&
            from !== states_1.ConversationState.ESCLARECER_DUVIDA);
    }
    restorePreviousState(estadoAnterior) {
        if (estadoAnterior && Object.values(states_1.ConversationState).includes(estadoAnterior)) {
            return estadoAnterior;
        }
        return states_1.ConversationState.IDENTIFICAR_NECESSIDADE;
    }
}
exports.TransitionService = TransitionService;
exports.transitionService = new TransitionService();
