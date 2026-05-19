"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.osController = exports.OsController = void 0;
const os_repository_1 = require("../repositories/os.repository");
const mensagem_repository_1 = require("../repositories/mensagem.repository");
const cliente_repository_1 = require("../repositories/cliente.repository");
const whatsapp_service_1 = require("../services/whatsapp.service");
const client_1 = require("@prisma/client");
const server_1 = require("../server");
const prisma_1 = require("../config/prisma");
const notification_service_1 = require("../services/notification.service");
const osRepo = new os_repository_1.OsRepository();
const mensagemRepo = new mensagem_repository_1.MensagemRepository();
const clienteRepo = new cliente_repository_1.ClienteRepository();
class OsController {
    // POST /api/os — Cria uma Ordem de Serviço a partir do painel do cliente
    async create(req, res) {
        try {
            const { clienteId, especificacoes, observacoes } = req.body;
            if (!clienteId) {
                return res.status(400).json({ error: 'clienteId é obrigatório.' });
            }
            // Verifica se o cliente existe para evitar erro de Foreign Key
            const clienteExistente = await clienteRepo.findById(clienteId);
            if (!clienteExistente) {
                console.log(`⚠️ Cliente ${clienteId} não encontrado no banco. Criando registro de fallback automaticamente...`);
                const numAleatorio = Math.floor(1000 + Math.random() * 9000);
                await prisma_1.prisma.usuario.create({
                    data: {
                        id: clienteId,
                        nome: clienteId === 'c1' ? 'Cliente Fallback' : 'Cliente Mock',
                        email: `${clienteId}_${Date.now()}@exemplo.com`,
                        telefone: `1199999${numAleatorio}`,
                        role: 'CLIENTE',
                    }
                });
            }
            // Se um arquivo foi enviado, anexamos o caminho/URL à especificação
            let specsObj = {};
            if (typeof especificacoes === 'string') {
                try {
                    specsObj = JSON.parse(especificacoes);
                }
                catch (e) {
                    specsObj = { raw: especificacoes };
                }
            }
            else if (especificacoes && typeof especificacoes === 'object') {
                specsObj = especificacoes;
            }
            if (req.file) {
                // Salvamos o caminho virtual/relativo do arquivo salvo
                specsObj.arteUrl = `/uploads/${req.file.filename}`;
            }
            const novaOs = await osRepo.create({
                clienteId,
                status: client_1.StatusOS.CRIADA,
                especificacoes: specsObj,
                observacoes: observacoes || null,
            });
            // Emite evento Socket.io para notificar administradores em tempo real
            server_1.io.emit('new-os', novaOs);
            // Notificar administradores via FCM
            notification_service_1.notificationService.sendToAdmins('Novo Pedido Recebido 📋', `Cliente ${clienteExistente?.nome || clienteId} enviou um novo pedido de serviço.`, { osId: novaOs.id, type: 'new_os' }).catch(err => console.error('❌ Erro ao enviar push de novo pedido:', err));
            return res.status(201).json(novaOs);
        }
        catch (error) {
            console.error('❌ Erro ao criar OS:', error);
            if (error?.name === 'PrismaClientInitializationError' || error?.message?.includes('database server')) {
                return res.status(503).json({ error: 'Serviço de banco de dados indisponível no momento.' });
            }
            return res.status(500).json({ error: 'Erro ao criar Ordem de Serviço.' });
        }
    }
    // Lista ordens de serviço por status
    async list(req, res) {
        try {
            const status = req.query.status;
            const ordens = await osRepo.findAll(status);
            return res.json(ordens);
        }
        catch (error) {
            if (error?.name === 'PrismaClientInitializationError' || error?.message?.includes('database server')) {
                return res.status(503).json({ error: 'Serviço de banco de dados indisponível no momento.' });
            }
            return res.status(500).json({ error: 'Erro ao buscar ordens.' });
        }
    }
    // Atualiza o status da OS (ex: PRONTA_PARA_RETIRADA)
    async updateStatus(req, res) {
        try {
            const id = req.params.id;
            const { status } = req.body;
            if (!Object.values(client_1.StatusOS).includes(status)) {
                return res.status(400).json({ error: 'Status inválido.' });
            }
            const osAtualizada = await osRepo.updateStatus(id, status);
            // Mapeamento de status amigável para a notificação
            const statusNomes = {
                CRIADA: 'Criado',
                AGUARDANDO_ORCAMENTO: 'Aguardando Orçamento',
                EM_PRODUCAO: 'Em Produção ⚙️',
                PRONTA_PARA_RETIRADA: 'Pronto para Retirada 📦',
                ENTREGUE: 'Entregue ✅',
                CANCELADA: 'Cancelado ❌'
            };
            const statusFormatado = statusNomes[status] || status;
            // Notificar o cliente sobre a alteração do status do pedido
            notification_service_1.notificationService.sendToUser(osAtualizada.clienteId, 'Atualização no seu Pedido 📦', `O status do seu pedido #${osAtualizada.id.substring(0, 8)} foi alterado para: ${statusFormatado}.`, { osId: osAtualizada.id, status: osAtualizada.status, type: 'os_status' }).catch(err => console.error('❌ Erro ao enviar push de status:', err));
            return res.json(osAtualizada);
        }
        catch (error) {
            return res.status(500).json({ error: 'Erro ao atualizar status.' });
        }
    }
    // PATCH /api/os/:id — Atualiza dados e observações da OS
    async updateData(req, res) {
        try {
            const id = req.params.id;
            const { observacoes, especificacoes } = req.body;
            const updatePayload = {};
            if (observacoes !== undefined)
                updatePayload.observacoes = observacoes;
            if (especificacoes !== undefined)
                updatePayload.especificacoes = especificacoes;
            const osAtualizada = await osRepo.updateData(id, updatePayload);
            // Notificar o cliente sobre atualizações em especificações/observações do pedido
            notification_service_1.notificationService.sendToUser(osAtualizada.clienteId, 'Alteração no seu Pedido ✏️', `Seu pedido #${osAtualizada.id.substring(0, 8)} recebeu novas especificações ou observações.`, { osId: osAtualizada.id, type: 'os_update' }).catch(err => console.error('❌ Erro ao enviar push de alteração de dados:', err));
            return res.json(osAtualizada);
        }
        catch (error) {
            console.error('❌ Erro ao atualizar dados da OS:', error);
            return res.status(500).json({ error: 'Erro ao atualizar OS.' });
        }
    }
    // GET /api/os/:id/mensagens — Busca o histórico formatado para o chat no admin
    async getMensagensDaOs(req, res) {
        try {
            const id = req.params.id;
            const mensagens = await mensagemRepo.findHistoryByOsId(id);
            if (!mensagens)
                return res.status(404).json({ error: 'OS não encontrada.' });
            const historicoFormatado = mensagens.map((msg) => {
                const payload = msg.payload;
                return {
                    id: msg.id,
                    remetente: msg.origem === 'CLIENTE' ? 'cliente' : (msg.origem === 'BOT' ? 'ia' : 'gerente'),
                    texto: payload?.text || '[Mídia]',
                    data_hora: msg.criadoEm,
                };
            });
            return res.json(historicoFormatado);
        }
        catch (error) {
            if (error?.name === 'PrismaClientInitializationError' || error?.message?.includes('database server')) {
                return res.status(503).json({ error: 'Serviço de banco de dados indisponível no momento.' });
            }
            return res.status(500).json({ error: 'Erro interno.' });
        }
    }
    // INTERVENÇÃO HUMANA: Envia mensagem e silencia a IA
    async enviarMensagemGerente(req, res) {
        try {
            const { clienteId, texto } = req.body;
            const cliente = await clienteRepo.findById(clienteId);
            if (!cliente)
                return res.status(404).json({ error: 'Cliente não encontrado.' });
            // 1. Silencia a IA: O WebhookService ignorará as próximas mensagens deste cliente
            await clienteRepo.updateAtendimentoStatus(clienteId, true);
            // 2. Salva no banco de dados como origem GERENTE
            const mensagem = await mensagemRepo.create({
                usuarioId: cliente.id,
                payload: { text: texto },
                origem: 'GERENTE'
            });
            // 3. Dispara a mensagem real para o WhatsApp do cliente
            await whatsapp_service_1.whatsappService.sendMessage(cliente.telefone, texto);
            // 4. Notifica o Frontend (Socket.io) para atualizar o chat em tempo real
            server_1.io.emit(`chat-${cliente.id}`, {
                id: mensagem.id,
                origem: 'GERENTE',
                texto: texto,
                criadoEm: mensagem.criadoEm
            });
            return res.json({ success: true });
        }
        catch (error) {
            return res.status(500).json({ error: 'Falha ao enviar mensagem.' });
        }
    }
    // Métodos do Timer de produção
    async startTimer(req, res) {
        try {
            const id = req.params.id;
            const os = await osRepo.startTimer(id);
            return res.json(os);
        }
        catch (error) {
            return res.status(500).json({ error: 'Erro ao iniciar timer.' });
        }
    }
    async stopTimer(req, res) {
        try {
            const id = req.params.id;
            const os = await osRepo.stopTimer(id);
            return res.json(os);
        }
        catch (error) {
            return res.status(500).json({ error: 'Erro ao parar timer.' });
        }
    }
}
exports.OsController = OsController;
exports.osController = new OsController();
