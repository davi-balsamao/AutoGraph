import { Request, Response } from 'express';
import { OsRepository } from '../repositories/os.repository';
import { MensagemRepository } from '../repositories/mensagem.repository';
import { StatusOS } from '@prisma/client';

const osRepo = new OsRepository();
const mensagemRepo = new MensagemRepository();

export class OsController {
  // GET /api/os?status=AGUARDANDO_ORCAMENTO
  async list(req: Request, res: Response) {
    try {
      const status = req.query.status as StatusOS;
      const ordens = await osRepo.findAll(status);
      return res.json(ordens);
    } catch (error) {
      console.error('❌ Erro ao listar OS:', error);
      return res.status(500).json({ error: 'Erro ao buscar ordens de serviço.' });
    }
  }

  // PATCH /api/os/:id/status
  async updateStatus(req: Request, res: Response) {
    try {
      const id = req.params.id as string; 
      const { status } = req.body;

      // Validação básica se o status enviado existe no Enum do Prisma
      if (!Object.values(StatusOS).includes(status as StatusOS)) {
        return res.status(400).json({ error: 'Status inválido.' });
      }

      const osAtualizada = await osRepo.updateStatus(id, status as StatusOS);
      console.log(`✅ OS #${id} atualizada para o status: ${status}`);
      
      return res.json(osAtualizada);
    } catch (error) {
      console.error('❌ Erro ao atualizar status da OS:', error);
      return res.status(500).json({ error: 'Erro ao atualizar status.' });
    }
  }

  // GET /api/os/:id/mensagens
  async getMensagensDaOs(req: Request, res: Response) {
    try {
      const id = req.params.id as string; 
      const mensagens = await mensagemRepo.findHistoryByOsId(id);

      if (!mensagens) {
        return res.status(404).json({ error: 'Ordem de Serviço não encontrada.' });
      }

      const historicoFormatado = mensagens.map((msg) => {
        const payload = msg.payload as any;
        return {
          id: msg.id,
          remetente: msg.origem === 'CLIENTE' ? 'cliente' : 'ia',
          texto: payload?.text || '[Mídia]',
          data_hora: msg.criadoEm,
        };
      });

      return res.json(historicoFormatado);
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens:', error);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  }

  // PATCH /api/os/:id/timer/start
  async startTimer(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const os = await osRepo.startTimer(id);
      console.log(`⏱️ Timer iniciado para OS #${id}`);
      return res.json(os);
    } catch (error) {
      console.error('❌ Erro ao iniciar timer:', error);
      return res.status(500).json({ error: 'Erro ao iniciar timer.' });
    }
  }

  // PATCH /api/os/:id/timer/stop
  async stopTimer(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const os = await osRepo.stopTimer(id);
      console.log(`⏱️ Timer parado para OS #${id} — Duração: ${os.durationSeconds}s`);
      return res.json(os);
    } catch (error) {
      console.error('❌ Erro ao parar timer:', error);
      return res.status(500).json({ error: 'Erro ao parar timer.' });
    }
  }
}

export const osController = new OsController();