"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversasController = exports.ConversasController = void 0;
const prisma_1 = require("../config/prisma");
const state_service_1 = require("../services/state.service");
const cliente_repository_1 = require("../repositories/cliente.repository");
const states_1 = require("../fsm/states");
const server_1 = require("../server");
const clienteRepo = new cliente_repository_1.ClienteRepository();
const ESTADOS_VALIDOS = Object.values(states_1.ConversationState);
class ConversasController {
    // POST /api/conversas/:userId/assumir
    async assumir(req, res) {
        try {
            const paramId = req.params.userId;
            let cliente = await clienteRepo.findById(paramId);
            if (!cliente) {
                cliente = await clienteRepo.findByPhone(paramId);
            }
            if (!cliente)
                return res.status(404).json({ error: 'Cliente não encontrado.' });
            const sessao = await prisma_1.prisma.sessaoAtendimento.findFirst({
                where: { clienteId: cliente.id, ativa: true },
                orderBy: { criadoEm: 'desc' },
            });
            if (sessao) {
                const ctx = (0, states_1.parseContext)(sessao.contexto);
                // Só sobrescreve se ainda não havia takeover — preserva o estado
                // original caso o admin assuma/devolva múltiplas vezes.
                if (!ctx.estadoSalvoTakeover) {
                    ctx.estadoSalvoTakeover = sessao.estadoAtual;
                }
                await prisma_1.prisma.sessaoAtendimento.update({
                    where: { id: sessao.id },
                    data: { contexto: ctx },
                });
            }
            await clienteRepo.updateAtendimentoStatus(cliente.id, true);
            server_1.io.emit('conversa-assumida', { clienteId: cliente.id, telefone: cliente.telefone, clienteNome: cliente.nome });
            return res.json({ clienteId: cliente.id, telefone: cliente.telefone, atendimentoHumano: true });
        }
        catch (error) {
            console.error('❌ Erro ao assumir conversa:', error);
            return res.status(500).json({ error: 'Erro ao assumir conversa.' });
        }
    }
    // POST /api/conversas/:userId/devolver-ia
    async devolverIa(req, res) {
        try {
            const paramId = req.params.userId;
            let cliente = await clienteRepo.findById(paramId);
            if (!cliente) {
                cliente = await clienteRepo.findByPhone(paramId);
            }
            if (!cliente)
                return res.status(404).json({ error: 'Cliente não encontrado.' });
            const sessao = await prisma_1.prisma.sessaoAtendimento.findFirst({
                where: { clienteId: cliente.id, ativa: true },
                orderBy: { criadoEm: 'desc' },
            });
            let estadoRestaurado = null;
            if (sessao) {
                const ctx = (0, states_1.parseContext)(sessao.contexto);
                const alvo = ctx.estadoSalvoTakeover && ESTADOS_VALIDOS.includes(ctx.estadoSalvoTakeover)
                    ? ctx.estadoSalvoTakeover
                    : states_1.ConversationState.IDENTIFICAR_NECESSIDADE;
                // Limpa proposta pendente: admin pode ter resolvido o orçamento
                // manualmente durante o atendimento humano.
                delete ctx.propostaPendente;
                delete ctx.aguardandoFollowupEnviado;
                delete ctx.estadoSalvoTakeover;
                await state_service_1.stateService.transition(sessao.id, alvo, ctx);
                estadoRestaurado = alvo;
            }
            await clienteRepo.updateAtendimentoStatus(cliente.id, false);
            server_1.io.emit('conversa-devolvida', { clienteId: cliente.id, telefone: cliente.telefone, estadoRestaurado });
            return res.json({ clienteId: cliente.id, telefone: cliente.telefone, atendimentoHumano: false, estadoRestaurado });
        }
        catch (error) {
            console.error('❌ Erro ao devolver conversa para IA:', error);
            return res.status(500).json({ error: 'Erro ao devolver conversa.' });
        }
    }
    // GET /api/conversas/:userId/status — utilidade para o front
    async status(req, res) {
        try {
            const paramId = req.params.userId;
            let cliente = await clienteRepo.findById(paramId);
            if (!cliente) {
                cliente = await clienteRepo.findByPhone(paramId);
            }
            if (!cliente)
                return res.status(404).json({ error: 'Cliente não encontrado.' });
            const sessao = await prisma_1.prisma.sessaoAtendimento.findFirst({
                where: { clienteId: cliente.id, ativa: true },
                orderBy: { criadoEm: 'desc' },
            });
            return res.json({
                clienteId: cliente.id,
                atendimentoHumano: cliente.atendimentoHumano,
                estadoAtual: sessao?.estadoAtual ?? null,
            });
        }
        catch (error) {
            console.error('❌ Erro ao buscar status da conversa:', error);
            return res.status(500).json({ error: 'Erro interno.' });
        }
    }
    // GET /api/conversas/:userId/mensagens — histórico completo de mensagens
    async mensagens(req, res) {
        try {
            const paramId = req.params.userId;
            let cliente = await clienteRepo.findById(paramId);
            if (!cliente) {
                cliente = await clienteRepo.findByPhone(paramId);
            }
            if (!cliente)
                return res.status(404).json({ error: 'Cliente não encontrado.' });
            const limit = parseInt(req.query.limit) || 100;
            const mensagens = await prisma_1.prisma.mensagens.findMany({
                where: { usuarioId: cliente.id },
                orderBy: { criadoEm: 'asc' },
                take: limit,
            });
            // Formata para o contrato do Flutter
            const formatted = mensagens.map((m) => {
                const payload = m.payload;
                // Mensagem do CLIENTE: payload é o rawPayload do WhatsApp ({text: {body: "..."}} ou formato direto)
                // Mensagem do BOT/GERENTE: payload é {text: "..."}
                let text = '';
                if (m.origem === 'CLIENTE') {
                    text = payload?.text?.body || payload?.text || '';
                }
                else {
                    text = payload?.text || '';
                }
                let senderId;
                let receiverId;
                let isFromRAG;
                if (m.origem === 'CLIENTE') {
                    senderId = cliente.telefone;
                    receiverId = 'admin';
                    isFromRAG = false;
                }
                else if (m.origem === 'BOT') {
                    senderId = 'bot';
                    receiverId = cliente.telefone;
                    isFromRAG = true;
                }
                else {
                    // GERENTE
                    senderId = 'admin';
                    receiverId = cliente.telefone;
                    isFromRAG = false;
                }
                return {
                    id: m.id,
                    senderId,
                    senderName: m.origem === 'CLIENTE' ? cliente.nome : undefined,
                    clienteDbId: cliente.id,
                    receiverId,
                    text,
                    type: 'text',
                    timestamp: m.criadoEm.toISOString(),
                    isFromRAG,
                };
            });
            return res.json(formatted);
        }
        catch (error) {
            console.error('❌ Erro ao buscar mensagens:', error);
            return res.status(500).json({ error: 'Erro interno.' });
        }
    }
}
exports.ConversasController = ConversasController;
exports.conversasController = new ConversasController();
