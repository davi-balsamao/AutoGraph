/**
 * Handler do estado COLETAR_DADOS_ENTREGA.
 *
 * Contrato ([rag-test/estados/dados-entrega.md]):
 *  • Perguntar modalidade: retirada ou entrega?
 *  • Se entrega: coletar endereço (CEP, logradouro, número, complemento, cidade)
 *  • NÃO avançar sem definir modalidade
 *  • UMA pergunta por vez (Regra 2)
 *
 * Transições:
 *  → CONFIRMAR_PEDIDO quando modalidade definida e (retirada OU endereço suficiente)
 */

import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationContext, ConversationState, SessaoRecord } from '../states';
import { prepareContext } from './base.handler';

const RETIRADA_RE = /\b(retira[rd]|retir[oa]|buscar|busco|pego na loja|pegar na loja|na loja|loja)\b/i;
const ENTREGA_RE  = /\b(entreg[ar]|enviar|mandar|levar|receber)\b/i;
const ENDERECO_RE = /\b(rua|avenida|av\.|alameda|travessa|estrada|cep|n[ºo°]?\s*\d|endere[çc]o|bairro)\b/i;

/**
 * Heurística de endereço "completo o suficiente":
 *  - menciona logradouro (rua/av/etc) E número, OU
 *  - menciona CEP
 * Não é validação rigorosa — recepcionista revisa antes de enviar à produção.
 */
function enderecoSuficiente(texto: string): boolean {
  const t = texto.toLowerCase();
  const temLogradouro = /(rua|avenida|av\.|alameda|travessa|estrada)/.test(t);
  const temNumero = /\b\d{1,5}\b/.test(t);
  const temCep = /\b\d{5}-?\d{3}\b/.test(t);
  return (temLogradouro && temNumero) || temCep;
}

export class ColetarDadosEntregaHandler implements StateHandler {
  async handle(
    message: string,
    sessao: SessaoRecord,
    deps: HandlerDeps
  ): Promise<HandlerResult> {
    const { context: prepared } = prepareContext(message, sessao, deps);
    const context: ConversationContext = { ...prepared };
    const msg = message.trim();
    const modalidadeAtual = context.entrega?.modalidade;

    // Entrada via chain (mensagem vazia) sem modalidade: pergunta a modalidade.
    if (!msg && !modalidadeAtual) {
      return {
        response: 'Você prefere retirar na loja ou receber por entrega?',
        nextState: ConversationState.COLETAR_DADOS_ENTREGA,
        updatedContext: context,
      };
    }

    // Detecta retirada (palavra explícita do cliente).
    if (RETIRADA_RE.test(msg)) {
      context.entrega = { modalidade: 'retirada' };
      return {
        response: '',
        nextState: ConversationState.CONFIRMAR_PEDIDO,
        updatedContext: context,
        chainNext: ConversationState.CONFIRMAR_PEDIDO,
      };
    }

    // Detecta entrega — explícita ou endereço já no texto.
    const sinalEntrega = ENTREGA_RE.test(msg) || ENDERECO_RE.test(msg);
    if (sinalEntrega || modalidadeAtual === 'entrega') {
      const enderecoNoTexto = ENDERECO_RE.test(msg) ? msg : context.entrega?.endereco;

      if (enderecoNoTexto && enderecoSuficiente(enderecoNoTexto)) {
        context.entrega = { modalidade: 'entrega', endereco: enderecoNoTexto };
        return {
          response: '',
          nextState: ConversationState.CONFIRMAR_PEDIDO,
          updatedContext: context,
          chainNext: ConversationState.CONFIRMAR_PEDIDO,
        };
      }

      // Modalidade entrega definida mas endereço incompleto — coleta progressiva.
      context.entrega = {
        modalidade: 'entrega',
        endereco: enderecoNoTexto || context.entrega?.endereco,
      };
      return {
        response: 'Perfeito! Me passa o endereço completo, por favor (rua, número, bairro, cidade e CEP).',
        nextState: ConversationState.COLETAR_DADOS_ENTREGA,
        updatedContext: context,
      };
    }

    // Mensagem não identificada — re-pergunta modalidade.
    return {
      response: 'Você prefere retirar na loja ou receber por entrega?',
      nextState: ConversationState.COLETAR_DADOS_ENTREGA,
      updatedContext: context,
    };
  }
}

export const coletarDadosEntregaHandler = new ColetarDadosEntregaHandler();
