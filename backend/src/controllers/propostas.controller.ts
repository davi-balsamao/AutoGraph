import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { stateService } from '../services/state.service';
import { ragService } from '../services/rag.service';
import { whatsappService } from '../services/whatsapp.service';
import { conversationService } from '../services/conversation.service';
import { MensagemRepository } from '../repositories/mensagem.repository';
import { ClienteRepository } from '../repositories/cliente.repository';
import { runHandlerChain } from '../fsm/state-router';
import {
  ConversationContext,
  ConversationState,
  parseContext,
  PropostaPendente,
  SessaoRecord,
} from '../fsm/states';
import { HandlerDeps } from '../fsm/handler.types';
import { io } from '../server';

const mensagemRepo = new MensagemRepository();
const clienteRepo = new ClienteRepository();

function toSessaoRecord(s: any): SessaoRecord {
  return {
    id: s.id,
    clienteId: s.clienteId,
    estadoAtual: s.estadoAtual,
    estadoAnterior: s.estadoAnterior,
    contexto: parseContext(s.contexto),
    ativa: s.ativa,
    lembreteEnviado: s.lembreteEnviado,
    criadoEm: s.criadoEm,
    atualizadoEm: s.atualizadoEm,
  };
}

async function findSessaoPendente(sessaoId: string) {
  const raw = await prisma.sessaoAtendimento.findUnique({
    where: { id: sessaoId },
    include: { cliente: true },
  });
  if (!raw) return null;
  return raw;
}

export class PropostasController {
  // GET /api/propostas — lista sessões aguardando aprovação admin
  async list(_req: Request, res: Response) {
    try {
      const sessoes = await prisma.sessaoAtendimento.findMany({
        where: { ativa: true, estadoAtual: ConversationState.AGUARDAR_APROVACAO_ADMIN },
        orderBy: { atualizadoEm: 'desc' },
        include: { cliente: true },
      });

      const propostas = sessoes
        .map((s: any) => {
          const ctx = parseContext(s.contexto);
          if (!ctx.propostaPendente) return null;
          return {
            sessaoId: s.id,
            clienteId: s.clienteId,
            osId: ctx.osId ?? null,
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
    } catch (error) {
      console.error('❌ Erro ao listar propostas:', error);
      return res.status(500).json({ error: 'Erro ao listar propostas.' });
    }
  }

  // PATCH /api/propostas/:sessaoId — admin edita especificacoes/orcamento
  async update(req: Request, res: Response) {
    try {
      const sessaoId = req.params.sessaoId as string;
      const { proposta } = req.body as { proposta: Partial<PropostaPendente> };

      const sessao = await findSessaoPendente(sessaoId);
      if (!sessao) return res.status(404).json({ error: 'Sessão não encontrada.' });

      const ctx = parseContext(sessao.contexto);
      if (!ctx.propostaPendente) {
        return res.status(400).json({ error: 'Sessão sem proposta pendente.' });
      }

      const novaProposta: PropostaPendente = {
        ...ctx.propostaPendente,
        ...(proposta?.especificacoes
          ? { especificacoes: { ...ctx.propostaPendente.especificacoes, ...proposta.especificacoes } }
          : {}),
        ...(proposta?.orcamento
          ? { orcamento: { ...ctx.propostaPendente.orcamento, ...proposta.orcamento } }
          : {}),
      };
      ctx.propostaPendente = novaProposta;

      const atualizada = await prisma.sessaoAtendimento.update({
        where: { id: sessaoId },
        data: { contexto: ctx as object },
      });

      io.emit('proposta-atualizada', { sessaoId, proposta: novaProposta });
      return res.json({ sessaoId, proposta: novaProposta, atualizadoEm: atualizada.atualizadoEm });
    } catch (error) {
      console.error('❌ Erro ao atualizar proposta:', error);
      return res.status(500).json({ error: 'Erro ao atualizar proposta.' });
    }
  }

  // POST /api/propostas/:sessaoId/aprovar — admin libera e dispara APRESENTAR_ORCAMENTO
  async approve(req: Request, res: Response) {
    try {
      const sessaoId = req.params.sessaoId as string;
      const sessao = await findSessaoPendente(sessaoId);
      if (!sessao) return res.status(404).json({ error: 'Sessão não encontrada.' });
      if (sessao.estadoAtual !== ConversationState.AGUARDAR_APROVACAO_ADMIN) {
        return res.status(409).json({ error: 'Sessão não está aguardando aprovação admin.' });
      }

      const ctx = parseContext(sessao.contexto);
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
      const transicionada = await stateService.transition(
        sessaoId,
        ConversationState.APRESENTAR_ORCAMENTO,
        ctx
      );

      const history = await conversationService.getFormattedHistorySince(
        transicionada.clienteId,
        transicionada.criadoEm
      );

      const deps: HandlerDeps = {
        ragService,
        conversationHistory: history || '',
        clienteNome: sessao.cliente.nome,
        clienteTelefone: sessao.cliente.telefone,
      };

      const chain = await runHandlerChain(transicionada, '', deps);
      const resposta = chain.responseParts.join('\n').trim();

      if (resposta) {
        const msgBot = await mensagemRepo.create({
          usuarioId: sessao.clienteId,
          payload: { text: resposta },
          origem: 'BOT',
        });
        io.emit('message', {
          id: msgBot.id.toString(),
          senderId: 'bot',
          receiverId: sessao.cliente.telefone,
          text: resposta,
          type: 'text',
          timestamp: new Date().toISOString(),
          isFromRAG: true,
        });
        await whatsappService.sendMessage(sessao.cliente.telefone, resposta);
      }

      io.emit('proposta-aprovada', { sessaoId, clienteId: sessao.clienteId });

      return res.json({
        sessaoId,
        estadoAtual: chain.sessao.estadoAtual,
        mensagemEnviada: resposta || null,
      });
    } catch (error) {
      console.error('❌ Erro ao aprovar proposta:', error);
      return res.status(500).json({ error: 'Erro ao aprovar proposta.' });
    }
  }

  // POST /api/propostas/:sessaoId/rejeitar — admin recusa, escala humano
  async reject(req: Request, res: Response) {
    try {
      const sessaoId = req.params.sessaoId as string;
      const { motivo } = (req.body || {}) as { motivo?: string };

      const sessao = await findSessaoPendente(sessaoId);
      if (!sessao) return res.status(404).json({ error: 'Sessão não encontrada.' });

      const ctx: ConversationContext = parseContext(sessao.contexto);
      ctx.estadoSalvoTakeover = sessao.estadoAtual;
      delete ctx.propostaPendente;
      delete ctx.aguardandoFollowupEnviado;

      await stateService.transition(sessaoId, ConversationState.ESCALAR_HUMANO, ctx);
      await clienteRepo.updateAtendimentoStatus(sessao.clienteId, true);

      io.emit('proposta-rejeitada', { sessaoId, clienteId: sessao.clienteId, motivo: motivo || null });
      return res.json({ sessaoId, atendimentoHumano: true });
    } catch (error) {
      console.error('❌ Erro ao rejeitar proposta:', error);
      return res.status(500).json({ error: 'Erro ao rejeitar proposta.' });
    }
  }
}

export const propostasController = new PropostasController();
// Suprime warning de import não usado de toSessaoRecord (mantido pra futuro uso).
void toSessaoRecord;
