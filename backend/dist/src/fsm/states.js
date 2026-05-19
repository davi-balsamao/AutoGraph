"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationState = void 0;
exports.parseContext = parseContext;
exports.isConversationState = isConversationState;
var ConversationState;
(function (ConversationState) {
    ConversationState["BOAS_VINDAS"] = "BOAS_VINDAS";
    ConversationState["IDENTIFICAR_NECESSIDADE"] = "IDENTIFICAR_NECESSIDADE";
    ConversationState["COLETAR_ESPECIFICACOES"] = "COLETAR_ESPECIFICACOES";
    ConversationState["VALIDAR_ARQUIVO"] = "VALIDAR_ARQUIVO";
    ConversationState["CALCULAR_ORCAMENTO"] = "CALCULAR_ORCAMENTO";
    ConversationState["AGUARDAR_APROVACAO_ADMIN"] = "AGUARDAR_APROVACAO_ADMIN";
    ConversationState["APRESENTAR_ORCAMENTO"] = "APRESENTAR_ORCAMENTO";
    ConversationState["AGUARDAR_APROVACAO"] = "AGUARDAR_APROVACAO";
    ConversationState["NEGOCIAR"] = "NEGOCIAR";
    ConversationState["COLETAR_DADOS_ENTREGA"] = "COLETAR_DADOS_ENTREGA";
    ConversationState["CONFIRMAR_PEDIDO"] = "CONFIRMAR_PEDIDO";
    ConversationState["GERAR_OS"] = "GERAR_OS";
    ConversationState["ESCLARECER_DUVIDA"] = "ESCLARECER_DUVIDA";
    ConversationState["PRODUTO_INDISPONIVEL"] = "PRODUTO_INDISPONIVEL";
    ConversationState["ESCALAR_HUMANO"] = "ESCALAR_HUMANO";
    ConversationState["AGUARDAR_RETORNO"] = "AGUARDAR_RETORNO";
    ConversationState["ENCERRAR"] = "ENCERRAR";
})(ConversationState || (exports.ConversationState = ConversationState = {}));
function parseContext(raw) {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        return raw;
    }
    return {};
}
function isConversationState(value) {
    return Object.values(ConversationState).includes(value);
}
