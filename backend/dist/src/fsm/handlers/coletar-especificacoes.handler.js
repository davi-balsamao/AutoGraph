"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coletarEspecificacoesHandler = exports.ColetarEspecificacoesHandler = void 0;
const entity_extraction_service_1 = require("../../services/entity-extraction.service");
const catalog_util_1 = require("../catalog.util");
const context_util_1 = require("../context.util");
const states_1 = require("../states");
const transition_service_1 = require("../transition.service");
const base_handler_1 = require("./base.handler");
const TRANSITION_MSG = 'Já anotei tudo! Vou processar seu orçamento e enviar para a nossa equipe aprovar no sistema. Assim que liberado, te passo o valor aqui mesmo, ok?';
function perguntaTamanhoPersonalizado(message) {
    return /\b(maior|menor|só tem|so tem|apenas essas|outro tamanho|diferente|personalizad|customizad|algo maior|mais grande)\b/i.test(message);
}
class ColetarEspecificacoesHandler {
    async handle(message, sessao, deps) {
        const produtoTravado = sessao.contexto.produto;
        const produtoNaMensagem = entity_extraction_service_1.entityExtractionService.identificarProdutoNaMensagem(message);
        if (produtoNaMensagem && produtoTravado && produtoNaMensagem.produto !== produtoTravado) {
            // Troca implícita de produto no meio da coleta — delega ao router na próxima volta;
            // aqui seguimos com o produto já travado até o intent capturar
        }
        // Fluxo 20: cliente persiste com off-topic enquanto está na coleta sem
        // produto definido — reforça o redirecionamento e contabiliza a tentativa.
        const offTopicCount = sessao.contexto.offTopicCount || 0;
        if ((0, base_handler_1.isOffTopicMessage)(message) && !produtoTravado && !produtoNaMensagem) {
            return {
                response: 'Conseguimos te ajudar só com produtos gráficos. Me diz qual produto você precisa para eu te passar o orçamento?',
                nextState: states_1.ConversationState.COLETAR_ESPECIFICACOES,
                updatedContext: { ...sessao.contexto, offTopicCount: offTopicCount + 1 },
            };
        }
        // Fluxo 20: depois de várias mensagens off-topic, quando o cliente
        // finalmente menciona um produto, o bot prefere pausar o atendimento e
        // aguardar o cliente voltar com calma em vez de tocar o pedido junto com
        // a conversa dispersa.
        if (offTopicCount >= 2 && produtoNaMensagem && !produtoTravado) {
            return {
                response: 'Combinado! Vou ficar por aqui aguardando. Quando você puder me passar os detalhes do pedido com calma, é só me chamar que retomo daqui.',
                nextState: states_1.ConversationState.AGUARDAR_RETORNO,
                updatedContext: {
                    ...sessao.contexto,
                    produto: produtoNaMensagem.produto,
                    offTopicCount,
                },
            };
        }
        const prepared = await (0, base_handler_1.prepareContext)(message, sessao, deps);
        const entities = prepared.entities;
        let context = (0, context_util_1.syncContextFromEntities)({ ...sessao.contexto, produto: produtoTravado || sessao.contexto.produto }, entities);
        if (!context.produto && entities.produtoIdentificado) {
            context.produto = entities.produtoIdentificado;
        }
        if (context.produto && entities.perguntasFaltantes.length > 0) {
            context.specsPendentes = entities.perguntasFaltantes;
        }
        if (perguntaTamanhoPersonalizado(message)) {
            return {
                response: 'Sim, fazemos tamanhos personalizados! Me passa a largura e a altura em cm que você precisa (ex: 2,00 x 1,00m)?',
                nextState: states_1.ConversationState.COLETAR_ESPECIFICACOES,
                updatedContext: context,
            };
        }
        let nextState = transition_service_1.transitionService.resolve(states_1.ConversationState.COLETAR_ESPECIFICACOES, message, context, entities);
        if (nextState === states_1.ConversationState.ESCLARECER_DUVIDA) {
            const ragResult = await deps.ragService.queryWithState(message, states_1.ConversationState.ESCLARECER_DUVIDA, context, deps.conversationHistory);
            return {
                response: ragResult.answer,
                nextState: states_1.ConversationState.ESCLARECER_DUVIDA,
                updatedContext: context,
            };
        }
        if (nextState === states_1.ConversationState.VALIDAR_ARQUIVO) {
            return {
                response: 'Você já tem o arquivo de arte pronto para enviar? Aceitamos PDF, JPG, PNG ou TIFF.',
                nextState: states_1.ConversationState.VALIDAR_ARQUIVO,
                updatedContext: context,
            };
        }
        if (nextState === states_1.ConversationState.CALCULAR_ORCAMENTO) {
            return {
                response: TRANSITION_MSG,
                nextState: states_1.ConversationState.CALCULAR_ORCAMENTO,
                updatedContext: context,
                chainNext: states_1.ConversationState.CALCULAR_ORCAMENTO,
            };
        }
        const pendentes = context.specsPendentes ?? entities.perguntasFaltantes;
        if (pendentes.length > 0) {
            return {
                response: (0, catalog_util_1.formatarPerguntaCatalogo)(pendentes[0]),
                nextState: states_1.ConversationState.COLETAR_ESPECIFICACOES,
                updatedContext: context,
            };
        }
        const ragResult = await deps.ragService.queryWithState(message, states_1.ConversationState.COLETAR_ESPECIFICACOES, context, deps.conversationHistory);
        return {
            response: ragResult.answer,
            nextState: states_1.ConversationState.COLETAR_ESPECIFICACOES,
            updatedContext: context,
        };
    }
}
exports.ColetarEspecificacoesHandler = ColetarEspecificacoesHandler;
exports.coletarEspecificacoesHandler = new ColetarEspecificacoesHandler();
