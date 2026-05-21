import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { stateService } from '../services/state.service';
import { ClienteRepository } from '../repositories/cliente.repository';
import { ConversationState, parseContext } from '../fsm/states';
import { io } from '../server';

const clienteRepo = new ClienteRepository();

const ESTADOS_VALIDOS = Object.values(ConversationState);

export class ConversasController {
  // GET /api/conversas — lista sessões ativas com último preview
  async list(_req: Request, res: Response) {
    try {
      const sessoes = await prisma.sessaoAtendimento.findMany({
        where: { ativa: true },
        include: {
          cliente: {
            include: { mensagens: { orderBy: { criadoEm: 'desc' }, take: 1 } }
          }
        },
        orderBy: { atualizadoEm: 'desc' }
      });

      const result = sessoes.map((s: any) => {
        const payload = s.cliente.mensagens[0]?.payload as any;
        return {
          clienteId: s.clienteId,
          sessaoId: s.id,
          clienteNome: s.cliente.nome,
          clienteTelefone: s.cliente.telefone,
          ultimaMensagem: payload?.text ?? null,
          ultimaMensagemEm: s.cliente.mensagens[0]?.criadoEm ?? s.atualizadoEm,
          atendimentoHumano: s.cliente.atendimentoHumano,
          estadoAtual: s.estadoAtual,
        };
      });

      return res.json(result);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao listar conversas.' });
    }
  }

  // POST /api/conversas/:userId/assumir
  async assumir(req: Request, res: Response) {
    try {
      const paramId = req.params.userId as string;
      let cliente = await clienteRepo.findById(paramId);
      if (!cliente) {
        cliente = await clienteRepo.findByPhone(paramId);
      }
      if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado.' });

      const sessao = await prisma.sessaoAtendimento.findFirst({
        where: { clienteId: cliente.id, ativa: true },
        orderBy: { criadoEm: 'desc' },
      });

      if (sessao) {
        const ctx = parseContext(sessao.contexto);
        // Só sobrescreve se ainda não havia takeover — preserva o estado
        // original caso o admin assuma/devolva múltiplas vezes.
        if (!ctx.estadoSalvoTakeover) {
          ctx.estadoSalvoTakeover = sessao.estadoAtual;
        }
        await prisma.sessaoAtendimento.update({
          where: { id: sessao.id },
          data: { contexto: ctx as object },
        });
      }

      await clienteRepo.updateAtendimentoStatus(cliente.id, true);
      io.emit('conversa-assumida', { clienteId: cliente.id, telefone: cliente.telefone, clienteNome: cliente.nome });
      return res.json({ clienteId: cliente.id, telefone: cliente.telefone, atendimentoHumano: true });
    } catch (error) {
      console.error('❌ Erro ao assumir conversa:', error);
      return res.status(500).json({ error: 'Erro ao assumir conversa.' });
    }
  }

  // POST /api/conversas/:userId/devolver-ia
  async devolverIa(req: Request, res: Response) {
    try {
      const paramId = req.params.userId as string;
      let cliente = await clienteRepo.findById(paramId);
      if (!cliente) {
        cliente = await clienteRepo.findByPhone(paramId);
      }
      if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado.' });

      const sessao = await prisma.sessaoAtendimento.findFirst({
        where: { clienteId: cliente.id, ativa: true },
        orderBy: { criadoEm: 'desc' },
      });

      let estadoRestaurado: string | null = null;
      if (sessao) {
        const ctx = parseContext(sessao.contexto);
        const alvo =
          ctx.estadoSalvoTakeover && ESTADOS_VALIDOS.includes(ctx.estadoSalvoTakeover as ConversationState)
            ? (ctx.estadoSalvoTakeover as ConversationState)
            : ConversationState.IDENTIFICAR_NECESSIDADE;

        // Limpa proposta pendente: admin pode ter resolvido o orçamento
        // manualmente durante o atendimento humano.
        delete ctx.propostaPendente;
        delete ctx.aguardandoFollowupEnviado;
        delete ctx.estadoSalvoTakeover;

        await stateService.transition(sessao.id, alvo, ctx);
        estadoRestaurado = alvo;
      }

      await clienteRepo.updateAtendimentoStatus(cliente.id, false);
      io.emit('conversa-devolvida', { clienteId: cliente.id, telefone: cliente.telefone, estadoRestaurado });
      return res.json({ clienteId: cliente.id, telefone: cliente.telefone, atendimentoHumano: false, estadoRestaurado });
    } catch (error) {
      console.error('❌ Erro ao devolver conversa para IA:', error);
      return res.status(500).json({ error: 'Erro ao devolver conversa.' });
    }
  }

  // GET /api/conversas/:userId/status — utilidade para o front
  async status(req: Request, res: Response) {
    try {
      const paramId = req.params.userId as string;
      let cliente = await clienteRepo.findById(paramId);
      if (!cliente) {
        cliente = await clienteRepo.findByPhone(paramId);
      }
      if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado.' });

      const sessao = await prisma.sessaoAtendimento.findFirst({
        where: { clienteId: cliente.id, ativa: true },
        orderBy: { criadoEm: 'desc' },
      });

      return res.json({
        clienteId: cliente.id,
        atendimentoHumano: cliente.atendimentoHumano,
        estadoAtual: sessao?.estadoAtual ?? null,
      });
    } catch (error) {
      console.error('❌ Erro ao buscar status da conversa:', error);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  }

  // GET /api/conversas/:userId/mensagens — histórico completo de mensagens
  async mensagens(req: Request, res: Response) {
    try {
      const paramId = req.params.userId as string;
      let cliente = await clienteRepo.findById(paramId);
      if (!cliente) {
        cliente = await clienteRepo.findByPhone(paramId);
      }
      if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado.' });

      const limit = parseInt(req.query.limit as string) || 100;

      const mensagens = await prisma.mensagens.findMany({
        where: { usuarioId: cliente.id },
        orderBy: { criadoEm: 'asc' },
        take: limit,
      });

      // Formata para o contrato do Flutter
      const formatted = mensagens.map((m) => {
        const payload = m.payload as Record<string, any>;
        // Mensagem do CLIENTE: payload é o rawPayload do WhatsApp ({text: {body: "..."}} ou formato direto)
        // Mensagem do BOT/GERENTE: payload é {text: "..."}
        let text = '';
        if (m.origem === 'CLIENTE') {
          text = payload?.text?.body || payload?.text || '';
        } else {
          text = payload?.text || '';
        }

        let senderId: string;
        let receiverId: string;
        let isFromRAG: boolean;

        if (m.origem === 'CLIENTE') {
          senderId = cliente!.telefone;
          receiverId = 'admin';
          isFromRAG = false;
        } else if (m.origem === 'BOT') {
          senderId = 'bot';
          receiverId = cliente!.telefone;
          isFromRAG = true;
        } else {
          // GERENTE
          senderId = 'admin';
          receiverId = cliente!.telefone;
          isFromRAG = false;
        }

        return {
          id: m.id,
          senderId,
          senderName: m.origem === 'CLIENTE' ? cliente!.nome : undefined,
          clienteDbId: cliente!.id,
          receiverId,
          text,
          type: 'text',
          timestamp: m.criadoEm.toISOString(),
          isFromRAG,
        };
      });

      return res.json(formatted);
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens:', error);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  }
}

export const conversasController = new ConversasController();
