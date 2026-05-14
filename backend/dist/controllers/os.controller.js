"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.osController = exports.OsController = void 0;
const os_repository_1 = require("../repositories/os.repository");
const mensagem_repository_1 = require("../repositories/mensagem.repository");
const client_1 = require("@prisma/client");
const osRepo = new os_repository_1.OsRepository();
const mensagemRepo = new mensagem_repository_1.MensagemRepository();
class OsController {
    // GET /api/os?status=AGUARDANDO_ORCAMENTO
    async list(req, res) {
        try {
            const status = req.query.status;
            const ordens = await osRepo.findAll(status);
            return res.json(ordens);
        }
        catch (error) {
            console.error('❌ Erro ao listar OS:', error);
            return res.status(500).json({ error: 'Erro ao buscar ordens de serviço.' });
        }
    }
    // PATCH /api/os/:id/status
    async updateStatus(req, res) {
        try {
            const id = req.params.id;
            const { status } = req.body;
            // Validação básica se o status enviado existe no Enum do Prisma
            if (!Object.values(client_1.StatusOS).includes(status)) {
                return res.status(400).json({ error: 'Status inválido.' });
            }
            const osAtualizada = await osRepo.updateStatus(id, status);
            console.log(`✅ OS #${id} atualizada para o status: ${status}`);
            return res.json(osAtualizada);
        }
        catch (error) {
            console.error('❌ Erro ao atualizar status da OS:', error);
            return res.status(500).json({ error: 'Erro ao atualizar status.' });
        }
    }
    // PATCH /api/os/:id
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
            return res.json(osAtualizada);
        }
        catch (error) {
            console.error('❌ Erro ao atualizar dados da OS:', error);
            return res.status(500).json({ error: 'Erro ao atualizar OS.' });
        }
    }
    // GET /api/os/:id/mensagens
    async getMensagensDaOs(req, res) {
        try {
            const id = req.params.id;
            const mensagens = await mensagemRepo.findHistoryByOsId(id);
            if (!mensagens) {
                return res.status(404).json({ error: 'Ordem de Serviço não encontrada.' });
            }
            const historicoFormatado = mensagens.map((msg) => {
                const payload = msg.payload;
                return {
                    id: msg.id,
                    remetente: msg.origem === 'CLIENTE' ? 'cliente' : 'ia',
                    texto: payload?.text || '[Mídia]',
                    data_hora: msg.criadoEm,
                };
            });
            return res.json(historicoFormatado);
        }
        catch (error) {
            console.error('❌ Erro ao buscar mensagens:', error);
            return res.status(500).json({ error: 'Erro interno.' });
        }
    }
    // PATCH /api/os/:id/timer/start
    async startTimer(req, res) {
        try {
            const id = req.params.id;
            const os = await osRepo.startTimer(id);
            console.log(`⏱️ Timer iniciado para OS #${id}`);
            return res.json(os);
        }
        catch (error) {
            console.error('❌ Erro ao iniciar timer:', error);
            return res.status(500).json({ error: 'Erro ao iniciar timer.' });
        }
    }
    // PATCH /api/os/:id/timer/stop
    async stopTimer(req, res) {
        try {
            const id = req.params.id;
            const os = await osRepo.stopTimer(id);
            console.log(`⏱️ Timer parado para OS #${id} — Duração: ${os.durationSeconds}s`);
            return res.json(os);
        }
        catch (error) {
            console.error('❌ Erro ao parar timer:', error);
            return res.status(500).json({ error: 'Erro ao parar timer.' });
        }
    }
}
exports.OsController = OsController;
exports.osController = new OsController();
