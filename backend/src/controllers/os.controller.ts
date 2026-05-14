import { Request, Response } from 'express';
import { OsRepository } from '../repositories/os.repository';
import { MensagemRepository } from '../repositories/mensagem.repository';
import { ClienteRepository } from '../repositories/cliente.repository';
import { whatsappService } from '../services/whatsapp.service';
import { StatusOS } from '@prisma/client';
import { io } from '../server';

const osRepo = new OsRepository();
const mensagemRepo = new MensagemRepository();
const clienteRepo = new ClienteRepository();

export class OsController {
  // Lista ordens de serviço por status
  async list(req: Request, res: Response) {
    try {
      const status = req.query.status as StatusOS;
      const ordens = await osRepo.findAll(status);
      return res.json(ordens);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar ordens.' });
    }
  }

  // Atualiza o status da OS (ex: PRONTA_PARA_RETIRADA)
  async updateStatus(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      if (!Object.values(StatusOS).includes(status as StatusOS)) {
        return res.status(400).json({ error: 'Status inválido.' });
      }
      const osAtualizada = await osRepo.updateStatus(id, status as StatusOS);
      return res.json(osAtualizada);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar status.' });
    }
  }

  // Busca o histórico formatado para o chat no admin
  async getMensagensDaOs(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const mensagens = await mensagemRepo.findHistoryByOsId(id);

      if (!mensagens) return res.status(404).json({ error: 'OS não encontrada.' });

      const historicoFormatado = mensagens.map((msg: any) => {
        const payload = msg.payload as any;
        return {
          id: msg.id,
          remetente: msg.origem === 'CLIENTE' ? 'cliente' : (msg.origem === 'BOT' ? 'ia' : 'gerente'),
          texto: payload?.text || '[Mídia]',
          data_hora: msg.criadoEm,
        };
      });

      return res.json(historicoFormatado);
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  }

  // INTERVENÇÃO HUMANA: Envia mensagem e silencia a IA
  async enviarMensagemGerente(req: Request, res: Response) {
    try {
      const { clienteId, texto } = req.body;
      const cliente = await clienteRepo.findById(clienteId);
      
      if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado.' });

      // 1. Silencia a IA: O WebhookService ignorará as próximas mensagens deste cliente
      await clienteRepo.updateAtendimentoStatus(clienteId, true);

      // 2. Salva no banco de dados como origem GERENTE
      const mensagem = await mensagemRepo.create({
        usuarioId: cliente.id,
        payload: { text: texto },
        origem: 'GERENTE'
      });

      // 3. Dispara a mensagem real para o WhatsApp do cliente
      await whatsappService.sendMessage(cliente.telefone, texto);

      // 4. Notifica o Frontend (Socket.io) para atualizar o chat em tempo real
      io.emit(`chat-${cliente.id}`, {
        id: mensagem.id,
        origem: 'GERENTE',
        texto: texto,
        criadoEm: mensagem.criadoEm
      });

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Falha ao enviar mensagem.' });
    }
  }

  // Métodos do Timer de produção
  async startTimer(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const os = await osRepo.startTimer(id);
      return res.json(os);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao iniciar timer.' });
    }
  }

  async stopTimer(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const os = await osRepo.stopTimer(id);
      return res.json(os);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao parar timer.' });
    }
  }
}

export const osController = new OsController();