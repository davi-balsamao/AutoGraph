import { Request, Response } from 'express';
import { OsRepository } from '../repositories/os.repository';
import { MensagemRepository } from '../repositories/mensagem.repository';
import { ClienteRepository } from '../repositories/cliente.repository';
import { whatsappService } from '../services/whatsapp.service';
import { StatusOS } from '@prisma/client';
import { io } from '../server';
import { prisma } from '../config/prisma';
import { notificationService } from '../services/notification.service';

const osRepo = new OsRepository();
const mensagemRepo = new MensagemRepository();
const clienteRepo = new ClienteRepository();

export class OsController {
  async create(req: Request, res: Response) {
    try {
      const { clienteId, especificacoes, observacoes } = req.body;
      if (!clienteId) {
        return res.status(400).json({ error: 'clienteId é obrigatório.' });
      }

      const clienteExistente = await clienteRepo.findById(clienteId);
      if (!clienteExistente) {
        await prisma.usuario.create({
          data: {
            id: clienteId,
            nome: 'Cliente Fallback',
            email: `${clienteId}_${Date.now()}@exemplo.com`,
            telefone: '000000000',
            role: 'CLIENTE',
          },
        });
      }

      const specsObj: any =
        typeof especificacoes === 'string'
          ? JSON.parse(especificacoes)
          : especificacoes;

      if (req.file) {
        specsObj.arteUrl = `/uploads/${req.file.filename}`;
      }

      const novaOs = await osRepo.create({
        clienteId,
        status: StatusOS.CRIADA,
        especificacoes: specsObj,
        observacoes: observacoes || null,
      });

      io.emit('new-os', novaOs);

      notificationService
        .sendToAdmins(
          'Novo Pedido Recebido 📋',
          `Cliente ${clienteExistente?.nome || clienteId} enviou um novo pedido de serviço.`,
          { osId: novaOs.id, type: 'new_os' }
        )
        .catch((err) =>
          console.error('❌ Erro ao enviar push de novo pedido:', err)
        );

      return res.status(201).json(novaOs);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao criar OS.' });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const status = req.query.status as StatusOS;
      const ordens = await osRepo.findAll(status);
      return res.json(ordens);
    } catch (error: any) {
      if (
        error?.name === 'PrismaClientInitializationError' ||
        error?.message?.includes('database server')
      ) {
        return res
          .status(503)
          .json({ error: 'Serviço de banco de dados indisponível no momento.' });
      }

      return res.status(500).json({ error: 'Erro ao buscar ordens.' });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status } = req.body;

      if (!Object.values(StatusOS).includes(status as StatusOS)) {
        return res.status(400).json({ error: 'Status inválido.' });
      }

      const osAtualizada = await osRepo.updateStatus(id, status as StatusOS);

      // Compatibilidade com o Kanban antigo/atual da branch local.
      io.emit('kanban_atualizado', osAtualizada);

      // Evento usado pelas telas novas em tempo real.
      io.emit('os-atualizada', osAtualizada);

      const statusNomes: Record<string, string> = {
        CRIADA: 'Criado',
        AGUARDANDO_ORCAMENTO: 'Aguardando Orçamento',
        EM_PRODUCAO: 'Em Produção',
        PRONTA_PARA_RETIRADA: 'Pronto para Retirada',
        ENTREGUE: 'Entregue',
        CANCELADA: 'Cancelado',
      };

      const statusFormatado = statusNomes[status as string] || status;

      notificationService
        .sendToUser(
          osAtualizada.clienteId,
          'Atualização no seu Pedido',
          `O status do seu pedido #${osAtualizada.id.substring(
            0,
            8
          )} foi alterado para: ${statusFormatado}.`,
          {
            osId: osAtualizada.id,
            status: osAtualizada.status,
            type: 'os_status',
          }
        )
        .catch((err) =>
          console.error('Erro ao enviar push de status:', err)
        );

      return res.json(osAtualizada);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar status.' });
    }
  }

  async updateData(req: Request, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { observacoes, especificacoes } = req.body;

      const osAtualizada = await osRepo.updateData(id, {
        observacoes,
        especificacoes,
      });

      io.emit('kanban_atualizado', osAtualizada);
      io.emit('os-atualizada', osAtualizada);

      notificationService
        .sendToUser(
          osAtualizada.clienteId,
          'Alteração no seu Pedido',
          `Seu pedido #${osAtualizada.id.substring(
            0,
            8
          )} recebeu novas especificações ou observações.`,
          { osId: osAtualizada.id, type: 'os_update' }
        )
        .catch((err) =>
          console.error('Erro ao enviar push de alteração de dados:', err)
        );

      return res.json(osAtualizada);
    } catch (error) {
      console.error('Erro ao atualizar dados da OS:', error);
      return res.status(500).json({ error: 'Erro ao atualizar dados.' });
    }
  }

  async getMensagensDaOs(req: Request, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const mensagens = await mensagemRepo.findHistoryByOsId(id);

      if (!mensagens) {
        return res.status(404).json({ error: 'OS não encontrada.' });
      }

      const historicoFormatado = mensagens.map((msg: any) => {
        const payload = msg.payload as any;

        return {
          id: msg.id,
          remetente:
            msg.origem === 'CLIENTE'
              ? 'cliente'
              : msg.origem === 'BOT'
                ? 'ia'
                : 'gerente',
          texto: payload?.text || '[Mídia]',
          data_hora: msg.criadoEm,
        };
      });

      return res.json(historicoFormatado);
    } catch (error: any) {
      if (
        error?.name === 'PrismaClientInitializationError' ||
        error?.message?.includes('database server')
      ) {
        return res
          .status(503)
          .json({ error: 'Serviço de banco de dados indisponível no momento.' });
      }

      return res.status(500).json({ error: 'Erro interno.' });
    }
  }

  async enviarMensagemGerente(req: Request, res: Response) {
    try {
      const { clienteId, texto } = req.body;
      const cliente = await clienteRepo.findById(clienteId);

      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado.' });
      }

      await clienteRepo.updateAtendimentoStatus(clienteId, true);

      const mensagem = await mensagemRepo.create({
        usuarioId: cliente.id,
        payload: { text: texto },
        origem: 'GERENTE',
      });

      await whatsappService.sendMessage(cliente.telefone, texto);

      io.emit(`chat-${cliente.id}`, {
        id: mensagem.id,
        origem: 'GERENTE',
        texto,
        criadoEm: mensagem.criadoEm,
      });

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Falha ao enviar mensagem.' });
    }
  }

  async startTimer(req: Request, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const os = await osRepo.startTimer(id);

      io.emit('kanban_atualizado', os);
      io.emit('os-atualizada', os);

      return res.json(os);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao iniciar timer.' });
    }
  }

  async stopTimer(req: Request, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const os = await osRepo.stopTimer(id);

      io.emit('kanban_atualizado', os);
      io.emit('os-atualizada', os);

      return res.json(os);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao parar timer.' });
    }
  }
}

export const osController = new OsController();