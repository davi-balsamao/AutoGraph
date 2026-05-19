"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apresentarOrcamentoHandler = exports.ApresentarOrcamentoHandler = void 0;
const states_1 = require("../states");
class ApresentarOrcamentoHandler {
    async handle(message, sessao, deps) {
        const context = { ...sessao.contexto, orcamentoApresentado: true };
        const produto = context.produto || 'seu pedido';
        const total = context.orcamento?.total;
        const prazo = context.orcamento?.prazo || '3 dias úteis';
        const validade = context.orcamento?.validade || '3 dias úteis';
        let response;
        if (total && total > 0) {
            const valorFmt = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            // Fase 2: removida pergunta de aprovação ("Podemos dar andamento?") —
            // apresentar-orcamento.md proíbe a pergunta de aprovação nesta mesma mensagem.
            // A reação do cliente é capturada pelo handler AGUARDAR_APROVACAO no próximo turno.
            response = `Orçamento aprovado! O valor total para ${produto} fica em ${valorFmt}. Prazo de produção: ${prazo}. Validade: ${validade}. O pagamento pode ser feito via Pix ou Cartão em até 3x.`;
        }
        else {
            const ragResult = await deps.ragService.queryWithState(message || 'Apresente o orçamento aprovado ao cliente com valor, prazo e validade.', states_1.ConversationState.APRESENTAR_ORCAMENTO, context, deps.conversationHistory || undefined);
            response = ragResult.answer;
        }
        return {
            response,
            nextState: states_1.ConversationState.AGUARDAR_APROVACAO,
            updatedContext: context,
        };
    }
}
exports.ApresentarOrcamentoHandler = ApresentarOrcamentoHandler;
exports.apresentarOrcamentoHandler = new ApresentarOrcamentoHandler();
