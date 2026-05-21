"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aguardarAprovacaoAdminHandler = exports.AguardarAprovacaoAdminHandler = void 0;
const states_1 = require("../states");
const server_1 = require("../../server");
const notification_service_1 = require("../../services/notification.service");
const MENSAGEM_ESPERA = 'Estou revisando seu orçamento e já te retorno por aqui em instantes.';
function montarPropostaPendente(context) {
    const orcamento = context.orcamento ?? {
        total: 0,
        prazo: '3 dias úteis',
        validade: '3 dias úteis',
    };
    const requisitos = Object.entries(context.specs || {}).map(([pergunta, resposta]) => ({
        pergunta,
        resposta,
    }));
    return {
        especificacoes: {
            produto: context.produto || 'Produto não informado',
            requisitos,
            orcamento,
        },
        orcamento,
        criadoEm: new Date().toISOString(),
    };
}
class AguardarAprovacaoAdminHandler {
    async handle(message, sessao, deps) {
        const context = { ...sessao.contexto };
        const jaTemProposta = !!context.propostaPendente;
        // Primeira entrada nesse estado (chain a partir de CALCULAR_ORCAMENTO):
        // monta a proposta, persiste no contexto, emite Socket + FCM, e pausa
        // sem mandar mensagem pro cliente.
        if (!jaTemProposta) {
            const proposta = montarPropostaPendente(context);
            context.propostaPendente = proposta;
            context.aguardandoFollowupEnviado = false;
            console.log(`🧾 [APROVACAO-ADMIN] Proposta criada — sessao=${sessao.id} cliente=${deps.clienteNome} produto=${proposta.especificacoes.produto} total=R$ ${proposta.orcamento.total.toFixed(2)}`);
            server_1.io.emit('proposta-pendente', {
                sessaoId: sessao.id,
                clienteId: sessao.clienteId,
                clienteNome: deps.clienteNome,
                clienteTelefone: deps.clienteTelefone,
                proposta,
            });
            console.log(`📢 [SOCKET] emit 'proposta-pendente' enviado.`);
            notification_service_1.notificationService
                .sendToAdmins('Orçamento aguardando aprovação 🧾', `${deps.clienteNome}: ${proposta.especificacoes.produto} — R$ ${proposta.orcamento.total
                .toFixed(2)
                .replace('.', ',')}`, { sessaoId: sessao.id, type: 'PROPOSTA_PENDENTE' })
                .then((sentCount) => console.log(`📨 [FCM] Push enviado para ${sentCount} admin(s).`))
                .catch((err) => console.error('❌ Erro ao enviar push de proposta pendente:', err));
            return {
                response: '',
                nextState: states_1.ConversationState.AGUARDAR_APROVACAO_ADMIN,
                updatedContext: context,
            };
        }
        // Cliente mandou follow-up enquanto admin não decidiu.
        // Manda 1x a mensagem de espera; depois fica em silêncio.
        if (message?.trim() && !context.aguardandoFollowupEnviado) {
            context.aguardandoFollowupEnviado = true;
            return {
                response: MENSAGEM_ESPERA,
                nextState: states_1.ConversationState.AGUARDAR_APROVACAO_ADMIN,
                updatedContext: context,
            };
        }
        return {
            response: '',
            nextState: states_1.ConversationState.AGUARDAR_APROVACAO_ADMIN,
            updatedContext: context,
        };
    }
}
exports.AguardarAprovacaoAdminHandler = AguardarAprovacaoAdminHandler;
exports.aguardarAprovacaoAdminHandler = new AguardarAprovacaoAdminHandler();
