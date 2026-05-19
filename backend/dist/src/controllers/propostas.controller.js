"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.propostasController = exports.PropostasController = void 0;
const prisma_1 = require("../config/prisma");
const state_service_1 = require("../services/state.service");
const rag_service_1 = require("../services/rag.service");
const whatsapp_service_1 = require("../services/whatsapp.service");
const conversation_service_1 = require("../services/conversation.service");
const mensagem_repository_1 = require("../repositories/mensagem.repository");
const cliente_repository_1 = require("../repositories/cliente.repository");
const state_router_1 = require("../fsm/state-router");
const states_1 = require("../fsm/states");
const server_1 = require("../server");
const mensagemRepo = new mensagem_repository_1.MensagemRepository();
const clienteRepo = new cliente_repository_1.ClienteRepository();
function toSessaoRecord(s) {
    return {
        id: s.id,
        clienteId: s.clienteId,
        estadoAtual: s.estadoAtual,
        estadoAnterior: s.estadoAnterior,
        contexto: (0, states_1.parseContext)(s.contexto),
        ativa: s.ativa,
        lembreteEnviado: s.lembreteEnviado,
        criadoEm: s.criadoEm,
        atualizadoEm: s.atualizadoEm,
    };
}
async function findSessaoPendente(sessaoId) {
    const raw = await prisma_1.prisma.sessaoAtendimento.findUnique({
        where: { id: sessaoId },
        include: { cliente: true },
    });
    if (!raw)
        return null;
    return raw;
}
class PropostasController {
    // GET /api/propostas — lista sessões aguardando aprovação admin
    async list(_req, res) {
        try {
            const sessoes = await prisma_1.prisma.sessaoAtendimento.findMany({
                where: { ativa: true, estadoAtual: states_1.ConversationState.AGUARDAR_APROVACAO_ADMIN },
                orderBy: { atualizadoEm: 'desc' },
                include: { cliente: true },
            });
            const propostas = sessoes
                .map((s) => {
                const ctx = (0, states_1.parseContext)(s.contexto);
                if (!ctx.propostaPendente)
                    return null;
                return {
                    sessaoId: s.id,
                    clienteId: s.clienteId,
                    cliente: {
                        id: s.cliente.id,
                        nome: s.cliente.nome,
                        telefone: s.cliente.telefone,
                    },
                    proposta: ctx.propostaPendente,
                    atualizadoEm: s.atualizadoEm,
                };
            })
                .filter(Boolean);
            return res.json(propostas);
        }
        catch (error) {
            console.error('❌ Erro ao listar propostas:', error);
            return res.status(500).json({ error: 'Erro ao listar propostas.' });
        }
    }
    // PATCH /api/propostas/:sessaoId — admin edita especificacoes/orcamento
    async update(req, res) {
        try {
            const sessaoId = req.params.sessaoId;
            const { proposta } = req.body;
            const sessao = await findSessaoPendente(sessaoId);
            if (!sessao)
                return res.status(404).json({ error: 'Sessão não encontrada.' });
            const ctx = (0, states_1.parseContext)(sessao.contexto);
            if (!ctx.propostaPendente) {
                return res.status(400).json({ error: 'Sessão sem proposta pendente.' });
            }
            const novaProposta = {
                ...ctx.propostaPendente,
                ...(proposta?.especificacoes
                    ? { especificacoes: { ...ctx.propostaPendente.especificacoes, ...proposta.especificacoes } }
                    : {}),
                ...(proposta?.orcamento
                    ? { orcamento: { ...ctx.propostaPendente.orcamento, ...proposta.orcamento } }
                    : {}),
            };
            ctx.propostaPendente = novaProposta;
            const atualizada = await prisma_1.prisma.sessaoAtendimento.update({
                where: { id: sessaoId },
                data: { contexto: ctx },
            });
            server_1.io.emit('proposta-atualizada', { sessaoId, proposta: novaProposta });
            return res.json({ sessaoId, proposta: novaProposta, atualizadoEm: atualizada.atualizadoEm });
        }
        catch (error) {
            console.error('❌ Erro ao atualizar proposta:', error);
            return res.status(500).json({ error: 'Erro ao atualizar proposta.' });
        }
    }
    // POST /api/propostas/:sessaoId/aprovar — admin libera e dispara APRESENTAR_ORCAMENTO
    async approve(req, res) {
        try {
            const sessaoId = req.params.sessaoId;
            const sessao = await findSessaoPendente(sessaoId);
            if (!sessao)
                return res.status(404).json({ error: 'Sessão não encontrada.' });
            if (sessao.estadoAtual !== states_1.ConversationState.AGUARDAR_APROVACAO_ADMIN) {
                return res.status(409).json({ error: 'Sessão não está aguardando aprovação admin.' });
            }
            const ctx = (0, states_1.parseContext)(sessao.contexto);
            if (!ctx.propostaPendente) {
                return res.status(400).json({ error: 'Sessão sem proposta pendente.' });
            }
            // Move orcamento aprovado para o contexto principal e descarta proposta.
            ctx.orcamento = ctx.propostaPendente.orcamento;
            ctx.specs = ctx.specs || {};
            delete ctx.propostaPendente;
            delete ctx.aguardandoFollowupEnviado;
            // Transita pra APRESENTAR_ORCAMENTO e reexecuta o chain — handler vai
            // gerar a mensagem do orçamento, transitar pra AGUARDAR_APROVACAO (cliente).
            const transicionada = await state_service_1.stateService.transition(sessaoId, states_1.ConversationState.APRESENTAR_ORCAMENTO, ctx);
            const history = await conversation_service_1.conversationService.getFormattedHistorySince(transicionada.clienteId, transicionada.criadoEm);
            const deps = {
                ragService: rag_service_1.ragService,
                conversationHistory: history || '',
                clienteNome: sessao.cliente.nome,
                clienteTelefone: sessao.cliente.telefone,
            };
            const chain = await (0, state_router_1.runHandlerChain)(transicionada, '', deps);
            const resposta = chain.responseParts.join('\n').trim();
            if (resposta) {
                const msgBot = await mensagemRepo.create({
                    usuarioId: sessao.clienteId,
                    payload: { text: resposta },
                    origem: 'BOT',
                });
                server_1.io.emit('message', {
                    id: msgBot.id.toString(),
                    senderId: 'bot',
                    receiverId: sessao.cliente.telefone,
                    text: resposta,
                    type: 'text',
                    timestamp: new Date().toISOString(),
                    isFromRAG: true,
                });
                await whatsapp_service_1.whatsappService.sendMessage(sessao.cliente.telefone, resposta);
            }
            server_1.io.emit('proposta-aprovada', { sessaoId, clienteId: sessao.clienteId });
            return res.json({
                sessaoId,
                estadoAtual: chain.sessao.estadoAtual,
                mensagemEnviada: resposta || null,
            });
        }
        catch (error) {
            console.error('❌ Erro ao aprovar proposta:', error);
            return res.status(500).json({ error: 'Erro ao aprovar proposta.' });
        }
    }
    // POST /api/propostas/:sessaoId/rejeitar — admin recusa, escala humano
    async reject(req, res) {
        try {
            const sessaoId = req.params.sessaoId;
            const { motivo } = (req.body || {});
            const sessao = await findSessaoPendente(sessaoId);
            if (!sessao)
                return res.status(404).json({ error: 'Sessão não encontrada.' });
            const ctx = (0, states_1.parseContext)(sessao.contexto);
            ctx.estadoSalvoTakeover = sessao.estadoAtual;
            delete ctx.propostaPendente;
            delete ctx.aguardandoFollowupEnviado;
            await state_service_1.stateService.transition(sessaoId, states_1.ConversationState.ESCALAR_HUMANO, ctx);
            await clienteRepo.updateAtendimentoStatus(sessao.clienteId, true);
            server_1.io.emit('proposta-rejeitada', { sessaoId, clienteId: sessao.clienteId, motivo: motivo || null });
            return res.json({ sessaoId, atendimentoHumano: true });
        }
        catch (error) {
            console.error('❌ Erro ao rejeitar proposta:', error);
            return res.status(500).json({ error: 'Erro ao rejeitar proposta.' });
        }
    }
}
exports.PropostasController = PropostasController;
exports.propostasController = new PropostasController();
// Suprime warning de import não usado de toSessaoRecord (mantido pra futuro uso).
void toSessaoRecord;
