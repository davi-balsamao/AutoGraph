"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stateRouter = exports.StateRouter = void 0;
exports.runHandlerChain = runHandlerChain;
const cliente_repository_1 = require("../repositories/cliente.repository");
const os_repository_1 = require("../repositories/os.repository");
const conversation_service_1 = require("../services/conversation.service");
const entity_extraction_service_1 = require("../services/entity-extraction.service");
const rag_service_1 = require("../services/rag.service");
const state_service_1 = require("../services/state.service");
const notification_service_1 = require("../services/notification.service");
const catalog_util_1 = require("./catalog.util");
const transition_service_1 = require("./transition.service");
const intent_service_1 = require("./intent.service");
const handlers_1 = require("./handlers");
const base_handler_1 = require("./handlers/base.handler");
const states_1 = require("./states");
const server_1 = require("../server");
const clienteRepo = new cliente_repository_1.ClienteRepository();
const osRepo = new os_repository_1.OsRepository();
const STATUS_LABEL = {
    CRIADA: 'em análise',
    AGUARDANDO_ORCAMENTO: 'aguardando orçamento',
    EM_PRODUCAO: 'em produção',
    PRONTA_PARA_RETIRADA: 'pronta para retirada',
    ENTREGUE: 'entregue',
    CANCELADA: 'cancelada',
};
function formatarPedidosCliente(clienteNome, pedidos) {
    if (!pedidos.length) {
        return `Não encontrei pedidos no seu histórico, ${clienteNome.split(' ')[0]}. Quer fazer um novo orçamento agora?`;
    }
    const linhas = pedidos.map((p) => {
        const especs = (p.especificacoes ?? {});
        const produto = especs?.produto || 'Pedido';
        const numero = p.id.slice(0, 8).toUpperCase();
        const status = STATUS_LABEL[p.status] ?? p.status.toLowerCase();
        const data = p.criadoEm.toLocaleDateString('pt-BR');
        return `• #${numero} — ${produto} (${status}, aberto em ${data})`;
    });
    const cabecalho = pedidos.length === 1
        ? 'Encontrei 1 pedido no seu histórico:'
        : `Aqui estão seus últimos ${pedidos.length} pedidos:`;
    return `${cabecalho}\n${linhas.join('\n')}\n\nQuer saber mais detalhes de algum deles ou abrir um novo orçamento?`;
}
/**
 * Estados onde o middleware DUVIDA NÃO desvia para ESCLARECER_DUVIDA:
 *  · BOAS_VINDAS: ainda não há produto/contexto; handler chama RAG por conta.
 *  · COLETAR_ESPECIFICACOES: o próprio handler responde dúvidas técnicas
 *    locais/RAG e depois retoma a coleta. Ex.: "O que é isso?" após
 *    "O papel será autocopiativo?"
 *  · ESCLARECER_DUVIDA: já é o destino, não faz sentido re-transitar.
 *  · ESCALAR_HUMANO: gerente assumiu, IA não deve agir.
 *  · ENCERRAR: o intent service já reabre nova sessão automaticamente.
 *  · AGUARDAR_RETORNO: sessão pausada, IA não responde.
 */
const ESTADOS_SEM_DESVIO_DUVIDA = new Set([
    states_1.ConversationState.BOAS_VINDAS,
    states_1.ConversationState.COLETAR_ESPECIFICACOES,
    states_1.ConversationState.ESCLARECER_DUVIDA,
    states_1.ConversationState.ESCALAR_HUMANO,
    states_1.ConversationState.ENCERRAR,
    states_1.ConversationState.AGUARDAR_RETORNO,
]);
/**
 * Executa o ciclo handler→handler (até `maxChain` saltos) a partir do estado
 * atual da sessão. Usado pelo router (entrada via webhook) e pelos endpoints
 * de aprovação admin, que precisam reentrar no FSM sem passar por detecção
 * de intent / histórico de cliente.
 */
async function runHandlerChain(initialSessao, message, deps, maxChain = 4) {
    let sessao = initialSessao;
    let currentState = (0, states_1.isConversationState)(sessao.estadoAtual)
        ? sessao.estadoAtual
        : states_1.ConversationState.BOAS_VINDAS;
    let context = (0, states_1.parseContext)(sessao.contexto);
    const responseParts = [];
    let gerouOs = false;
    let osMeta;
    let escalarHumano = false;
    for (let step = 0; step < maxChain; step++) {
        const handler = (0, handlers_1.getHandlerForState)(currentState);
        const result = await handler.handle(message, { ...sessao, contexto: context, estadoAtual: currentState }, deps);
        if (result.response?.trim()) {
            const texto = (0, base_handler_1.enrichForLeigo)(result.response.trim(), deps.conversationHistory);
            responseParts.push(texto);
            console.log(`🤖 Handler [${currentState}]: "${texto.substring(0, 500)}${texto.length > 500 ? '...' : ''}"`);
        }
        context = result.updatedContext;
        escalarHumano = escalarHumano || !!result.escalarHumano;
        let nextState = result.nextState;
        let estadoAnterior = sessao.estadoAnterior;
        if (transition_service_1.transitionService.shouldPushPreviousState(currentState, nextState)) {
            estadoAnterior = currentState;
        }
        if (nextState === states_1.ConversationState.ESCLARECER_DUVIDA &&
            currentState !== states_1.ConversationState.ESCLARECER_DUVIDA &&
            /\b(obrigad|entendi)\b/i.test(message) &&
            !result.chainNext) {
            nextState = transition_service_1.transitionService.restorePreviousState(estadoAnterior || null);
            estadoAnterior = null;
        }
        const updatedSessao = await state_service_1.stateService.transition(sessao.id, nextState, context, {
            previousState: estadoAnterior ?? undefined,
        });
        sessao = updatedSessao;
        currentState = nextState;
        if (result.gerarOs && context.osId) {
            gerouOs = true;
            osMeta = {
                id: context.osId,
                produto: context.produto || 'Pedido',
            };
            server_1.io.emit('nova-os', {
                id: context.osId,
                cliente: deps.clienteNome,
                produto: context.produto,
            });
        }
        if (escalarHumano) {
            await clienteRepo.updateAtendimentoStatus(sessao.clienteId, true);
            await notification_service_1.notificationService.sendToAdmins('Atendimento Escalado', `O cliente ${deps.clienteNome} precisa falar com um especialista.`, {
                type: 'escalation',
                clienteId: sessao.clienteId,
                telefone: deps.clienteTelefone,
            });
            server_1.io.emit('conversa-assumida', {
                clienteId: sessao.clienteId,
                telefone: deps.clienteTelefone,
                clienteNome: deps.clienteNome,
            });
        }
        if (result.chainNext) {
            currentState = result.chainNext;
            continue;
        }
        break;
    }
    return {
        responseParts,
        sessao,
        gerouOs,
        osMeta,
        escalarHumano,
    };
}
class StateRouter {
    async route(sessao, message, clienteNome, clienteTelefone) {
        let currentState = (0, states_1.isConversationState)(sessao.estadoAtual)
            ? sessao.estadoAtual
            : states_1.ConversationState.BOAS_VINDAS;
        let context = (0, states_1.parseContext)(sessao.contexto);
        const history = await conversation_service_1.conversationService.getFormattedHistorySince(sessao.clienteId, sessao.criadoEm);
        const conversationHistory = history
            ? `${history}\nCliente: ${message}`
            : `Cliente: ${message}`;
        const intent = await (0, intent_service_1.detectSessionIntent)(message, currentState, conversationHistory, context.produto);
        if (intent.type === 'NOVO_ATENDIMENTO' && currentState !== states_1.ConversationState.BOAS_VINDAS) {
            console.log('🔄 [FSM] Cliente pediu novo atendimento — sessão reiniciada.');
            if (context.propostaPendente) {
                server_1.io.emit('proposta-cancelada', {
                    sessaoId: sessao.id,
                    motivo: 'NOVO_ATENDIMENTO',
                });
            }
            sessao = await state_service_1.stateService.reiniciarSessao(sessao.clienteId);
            const resposta = (0, intent_service_1.mensagemNovoAtendimento)();
            sessao = await state_service_1.stateService.transition(sessao.id, states_1.ConversationState.IDENTIFICAR_NECESSIDADE, {}, { previousState: null });
            return { response: resposta, sessao };
        }
        if (intent.type === 'TROCAR_PRODUTO' &&
            currentState !== states_1.ConversationState.BOAS_VINDAS &&
            currentState !== states_1.ConversationState.GERAR_OS &&
            currentState !== states_1.ConversationState.ENCERRAR) {
            console.log(`🔄 [FSM] Troca de produto${intent.produtoIdentificado ? `: ${intent.produtoIdentificado}` : ''}`);
            if (context.propostaPendente) {
                server_1.io.emit('proposta-cancelada', {
                    sessaoId: sessao.id,
                    motivo: 'TROCAR_PRODUTO',
                });
            }
            sessao = await state_service_1.stateService.reiniciarContextoPedido(sessao.id, intent.produtoIdentificado || undefined);
            let resposta = (0, intent_service_1.mensagemTrocaProduto)(intent.produtoIdentificado);
            if (intent.produtoIdentificado) {
                const entities = await entity_extraction_service_1.entityExtractionService.extract(`Cliente: ${message}`, {
                    produtoAtual: intent.produtoIdentificado,
                });
                if (entities.perguntasFaltantes[0]) {
                    resposta = (0, catalog_util_1.formatarPerguntaCatalogo)(entities.perguntasFaltantes[0]);
                }
            }
            return { response: resposta, sessao };
        }
        const crossCutting = (0, base_handler_1.detectCrossCuttingIntent)(message);
        if (crossCutting === 'PAUSA' &&
            currentState !== states_1.ConversationState.AGUARDAR_RETORNO &&
            currentState !== states_1.ConversationState.ENCERRAR &&
            currentState !== states_1.ConversationState.BOAS_VINDAS) {
            console.log(`⏸️  [FSM] Cliente pediu pausa em ${currentState} — entrando em AGUARDAR_RETORNO.`);
            sessao = await state_service_1.stateService.transition(sessao.id, states_1.ConversationState.AGUARDAR_RETORNO, context, { previousState: currentState });
            return {
                response: 'Tudo bem! Vou pausar seu atendimento aqui. Quando voltar, é só me mandar mensagem que retomamos de onde paramos.',
                sessao,
            };
        }
        const deps = {
            ragService: rag_service_1.ragService,
            conversationHistory,
            clienteNome,
            clienteTelefone,
        };
        if (crossCutting === 'LISTAR_PEDIDOS') {
            console.log(`📦 [FSM] Cliente pediu histórico de pedidos em ${currentState}.`);
            try {
                const pedidos = await osRepo.findByCliente(sessao.clienteId, 5);
                return {
                    response: formatarPedidosCliente(clienteNome, pedidos),
                    sessao,
                };
            }
            catch (err) {
                console.error('❌ Falha ao listar pedidos do cliente:', err);
                return {
                    response: 'Tive um problema pra consultar seu histórico agora. Pode tentar de novo em um instante?',
                    sessao,
                };
            }
        }
        /**
         * DUVIDA global:
         * Para COLETAR_ESPECIFICACOES, NÃO desviamos aqui.
         * O próprio handler trata dúvidas técnicas no meio da coleta, inclusive
         * perguntas ambíguas como "O que é isso?" usando a pergunta pendente atual.
         */
        if (crossCutting === 'DUVIDA' &&
            !ESTADOS_SEM_DESVIO_DUVIDA.has(currentState)) {
            console.log(`❓ [FSM] Dúvida detectada em ${currentState} — desviando para ESCLARECER_DUVIDA.`);
            sessao = await state_service_1.stateService.transition(sessao.id, states_1.ConversationState.ESCLARECER_DUVIDA, context, { previousState: currentState });
            const chainDuvida = await runHandlerChain(sessao, message, deps);
            return {
                response: chainDuvida.responseParts.join('\n') || 'Um momento, por favor.',
                sessao: chainDuvida.sessao,
                gerouOs: chainDuvida.gerouOs,
                osMeta: chainDuvida.osMeta,
                escalarHumano: chainDuvida.escalarHumano,
            };
        }
        const chain = await runHandlerChain(sessao, message, deps);
        const silencioAdmin = chain.responseParts.length === 0 &&
            chain.sessao.estadoAtual === states_1.ConversationState.AGUARDAR_APROVACAO_ADMIN;
        return {
            response: silencioAdmin
                ? ''
                : chain.responseParts.join('\n') || 'Um momento, por favor.',
            sessao: chain.sessao,
            gerouOs: chain.gerouOs,
            osMeta: chain.osMeta,
            escalarHumano: chain.escalarHumano,
        };
    }
}
exports.StateRouter = StateRouter;
exports.stateRouter = new StateRouter();
