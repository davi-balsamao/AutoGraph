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
  // POST /api/os — Cria uma Ordem de Serviço a partir do painel do cliente
  async create(req: Request, res: Response) {
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
        await prisma.usuario.create({
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
      let specsObj: any = {};
      if (typeof especificacoes === 'string') {
        try {
          specsObj = JSON.parse(especificacoes);
        } catch (e) {
          specsObj = { raw: especificacoes };
        }
      } else if (especificacoes && typeof especificacoes === 'object') {
        specsObj = especificacoes;
      }

      if (req.file) {
        // Salvamos o caminho virtual/relativo do arquivo salvo
        specsObj.arteUrl = `/uploads/${req.file.filename}`;
      }

      const novaOs = await osRepo.create({
        clienteId,
        status: StatusOS.CRIADA,
        especificacoes: specsObj,
        observacoes: observacoes || null,
      });

      // Emite evento Socket.io para notificar administradores em tempo real
      io.emit('os-nova', novaOs);

      // Notificar administradores via FCM
      notificationService.sendToAdmins(
        'Novo Pedido Recebido 📋',
        `Cliente ${clienteExistente?.nome || clienteId} enviou um novo pedido de serviço.`,
        { osId: novaOs.id, type: 'new_os' }
      ).catch(err => console.error('❌ Erro ao enviar push de novo pedido:', err));

      return res.status(201).json(novaOs);
    } catch (error: any) {
      console.error('❌ Erro ao criar OS:', error);
      if (error?.name === 'PrismaClientInitializationError' || error?.message?.includes('database server')) {
        return res.status(503).json({ error: 'Serviço de banco de dados indisponível no momento.' });
      }
      return res.status(500).json({ error: 'Erro ao criar Ordem de Serviço.' });
    }
  }

  // Lista ordens de serviço por status
  async list(req: Request, res: Response) {
    try {
      const status = req.query.status as StatusOS;
      const ordens = await osRepo.findAll(status);
      return res.json(ordens);
    } catch (error: any) {
      if (error?.name === 'PrismaClientInitializationError' || error?.message?.includes('database server')) {
        return res.status(503).json({ error: 'Serviço de banco de dados indisponível no momento.' });
      }
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

      // Mapeamento de status amigável para a notificação
      const statusNomes: Record<string, string> = {
        CRIADA: 'Criado',
        AGUARDANDO_ORCAMENTO: 'Aguardando Orçamento',
        EM_PRODUCAO: 'Em Produção ⚙️',
        PRONTA_PARA_RETIRADA: 'Pronto para Retirada 📦',
        ENTREGUE: 'Entregue ✅',
        CANCELADA: 'Cancelado ❌'
      };
      const statusFormatado = statusNomes[status as string] || status;

      // Notificar o cliente sobre a alteração do status do pedido
      notificationService.sendToUser(
        osAtualizada.clienteId,
        'Atualização no seu Pedido 📦',
        `O status do seu pedido #${osAtualizada.id.substring(0, 8)} foi alterado para: ${statusFormatado}.`,
        { osId: osAtualizada.id, status: osAtualizada.status, type: 'os_status' }
      ).catch(err => console.error('❌ Erro ao enviar push de status:', err));

      return res.json(osAtualizada);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar status.' });
    }
  }


  // PATCH /api/os/:id — Atualiza dados e observações da OS
  async updateData(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { observacoes, especificacoes } = req.body;
      
      const updatePayload: any = {};
      if (observacoes !== undefined) updatePayload.observacoes = observacoes;
      if (especificacoes !== undefined) updatePayload.especificacoes = especificacoes;

      const osAtualizada = await osRepo.updateData(id, updatePayload);

      // Notificar o cliente sobre atualizações em especificações/observações do pedido
      notificationService.sendToUser(
        osAtualizada.clienteId,
        'Alteração no seu Pedido ✏️',
        `Seu pedido #${osAtualizada.id.substring(0, 8)} recebeu novas especificações ou observações.`,
        { osId: osAtualizada.id, type: 'os_update' }
      ).catch(err => console.error('❌ Erro ao enviar push de alteração de dados:', err));

      return res.json(osAtualizada);
    } catch (error) {
      console.error('❌ Erro ao atualizar dados da OS:', error);
      return res.status(500).json({ error: 'Erro ao atualizar OS.' });
    }
  }

  // GET /api/os/:id/mensagens — Busca o histórico formatado para o chat no admin
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
    } catch (error: any) {
      if (error?.name === 'PrismaClientInitializationError' || error?.message?.includes('database server')) {
        return res.status(503).json({ error: 'Serviço de banco de dados indisponível no momento.' });
      }
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