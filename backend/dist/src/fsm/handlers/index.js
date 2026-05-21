"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHandlerForState = getHandlerForState;
const states_1 = require("../states");
const aguardar_aprovacao_handler_1 = require("./aguardar-aprovacao.handler");
const aguardar_aprovacao_admin_handler_1 = require("./aguardar-aprovacao-admin.handler");
const aguardar_retorno_handler_1 = require("./aguardar-retorno.handler");
const apresentar_orcamento_handler_1 = require("./apresentar-orcamento.handler");
const boas_vindas_handler_1 = require("./boas-vindas.handler");
const calcular_orcamento_handler_1 = require("./calcular-orcamento.handler");
const coletar_dados_entrega_handler_1 = require("./coletar-dados-entrega.handler");
const coletar_especificacoes_handler_1 = require("./coletar-especificacoes.handler");
const confirmar_pedido_handler_1 = require("./confirmar-pedido.handler");
const encerrar_handler_1 = require("./encerrar.handler");
const escalar_humano_handler_1 = require("./escalar-humano.handler");
const esclarecer_duvida_handler_1 = require("./esclarecer-duvida.handler");
const gerar_os_handler_1 = require("./gerar-os.handler");
const identificar_necessidade_handler_1 = require("./identificar-necessidade.handler");
const negociar_handler_1 = require("./negociar.handler");
const produto_indisponivel_handler_1 = require("./produto-indisponivel.handler");
const validar_arquivo_handler_1 = require("./validar-arquivo.handler");
function getHandlerForState(state) {
    switch (state) {
        case states_1.ConversationState.BOAS_VINDAS:
            return boas_vindas_handler_1.boasVindasHandler;
        case states_1.ConversationState.IDENTIFICAR_NECESSIDADE:
            return identificar_necessidade_handler_1.identificarNecessidadeHandler;
        case states_1.ConversationState.COLETAR_ESPECIFICACOES:
            return coletar_especificacoes_handler_1.coletarEspecificacoesHandler;
        case states_1.ConversationState.VALIDAR_ARQUIVO:
            return validar_arquivo_handler_1.validarArquivoHandler;
        case states_1.ConversationState.CALCULAR_ORCAMENTO:
            return calcular_orcamento_handler_1.calcularOrcamentoHandler;
        case states_1.ConversationState.AGUARDAR_APROVACAO_ADMIN:
            return aguardar_aprovacao_admin_handler_1.aguardarAprovacaoAdminHandler;
        case states_1.ConversationState.APRESENTAR_ORCAMENTO:
            return apresentar_orcamento_handler_1.apresentarOrcamentoHandler;
        case states_1.ConversationState.AGUARDAR_APROVACAO:
            return aguardar_aprovacao_handler_1.aguardarAprovacaoHandler;
        case states_1.ConversationState.NEGOCIAR:
            return negociar_handler_1.negociarHandler;
        case states_1.ConversationState.COLETAR_DADOS_ENTREGA:
            return coletar_dados_entrega_handler_1.coletarDadosEntregaHandler;
        case states_1.ConversationState.CONFIRMAR_PEDIDO:
            return confirmar_pedido_handler_1.confirmarPedidoHandler;
        case states_1.ConversationState.GERAR_OS:
            return gerar_os_handler_1.gerarOsHandler;
        case states_1.ConversationState.ESCLARECER_DUVIDA:
            return esclarecer_duvida_handler_1.esclarecerDuvidaHandler;
        case states_1.ConversationState.PRODUTO_INDISPONIVEL:
            return produto_indisponivel_handler_1.produtoIndisponivelHandler;
        case states_1.ConversationState.ESCALAR_HUMANO:
            return escalar_humano_handler_1.escalarHumanoHandler;
        case states_1.ConversationState.AGUARDAR_RETORNO:
            return aguardar_retorno_handler_1.aguardarRetornoHandler;
        case states_1.ConversationState.ENCERRAR:
            return encerrar_handler_1.encerrarHandler;
        default:
            return identificar_necessidade_handler_1.identificarNecessidadeHandler;
    }
}
