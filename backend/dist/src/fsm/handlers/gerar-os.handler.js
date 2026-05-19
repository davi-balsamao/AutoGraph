"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gerarOsHandler = exports.GerarOsHandler = void 0;
const os_repository_1 = require("../../repositories/os.repository");
const states_1 = require("../states");
const osRepo = new os_repository_1.OsRepository();
/**
 * Mensagem sugerida usada no GERAR_OS. Antes era gerada por LLM, mas a chamada
 * estava no caminho crítico do chain CONFIRMAR_PEDIDO → GERAR_OS → ENCERRAR e
 * estourava o polling do helper de testes. Versão determinística garante < 1s.
 */
function montarMensagemSugerida(nomeCliente, context) {
    const produto = context.produto || 'produto';
    const total = context.orcamento?.total;
    const valor = total
        ? total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : 'R$ ____';
    return `Olá ${nomeCliente}, seu orçamento de ${produto} foi aprovado: total ${valor}. Pagamento via Pix ou cartão em até 3x.`;
}
class GerarOsHandler {
    async handle(_message, sessao, deps) {
        const context = { ...sessao.contexto };
        const especificacoes = {
            produto: context.produto || 'Produto não informado',
            requisitos: Object.entries(context.specs || {}).map(([pergunta, resposta]) => ({
                pergunta,
                resposta,
            })),
            orcamento: context.orcamento,
            entrega: context.entrega,
        };
        const mensagemSugerida = montarMensagemSugerida(deps.clienteNome, context);
        // Fase 2: observações ficam vazias por padrão. A validação técnica da arte
        // (DPI, sangria, formato) é responsabilidade da recepcionista no momento
        // da revisão da O.S. — conforme validar-arquivo.md:3.
        const os = await osRepo.create({
            clienteId: sessao.clienteId,
            especificacoes,
            mensagem_sugerida: mensagemSugerida,
        });
        context.osId = os.id;
        const response = `Pedido registrado! Sua Ordem de Serviço é a número ${os.id.slice(0, 8).toUpperCase()}. Nossa equipe entrará em contato para combinar o pagamento e os próximos passos. Obrigada pela preferência!`;
        return {
            response,
            nextState: states_1.ConversationState.ENCERRAR,
            updatedContext: context,
            gerarOs: true,
        };
    }
}
exports.GerarOsHandler = GerarOsHandler;
exports.gerarOsHandler = new GerarOsHandler();
