/**
 * Handler do estado VALIDAR_ARQUIVO.
 *
 * Contrato ([rag-test/estados/validar-arquivo.md]):
 *  • Perguntar de forma simples: "Você já tem o arquivo de arte pronto?"
 *  • Informar formatos aceitos: PDF, JPG, PNG, TIFF
 *  • NÃO pedir DPI/resolução/sangria ao cliente (recepcionista valida tecnicamente)
 *  • Se tem arte → CALCULAR_ORCAMENTO
 *  • Se não tem → orientar (designer / ferramenta de preferência), permanece no estado
 *  • Se vai enviar depois → AGUARDAR_RETORNO
 */

import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationContext, ConversationState, SessaoRecord } from '../states';
import { prepareContext } from './base.handler';

const ARTE_PRONTA_RE =
  /\b(sim|tenho|j[áa] tenho|est[áa] pronto|est[áa] pronta|pronta|pronto|finalizad[oa]|enviei|mandei|anexei|segue|pode usar)\b/i;

const SEM_ARTE_RE =
  /\b(n[ãa]o tenho|n[ãa]o tem|sem arte|n[ãa]o (estou |to )?com a arte|preciso (fazer|criar)|n[ãa]o sei (fazer|criar))\b/i;

const ENVIA_DEPOIS_RE =
  /\b(envio depois|envia depois|mando depois|te mando|enviar depois|depois te (mando|envio)|amanh[ãa]|na pr[óo]xima|outro dia)\b/i;

const ORIENTACAO_SEM_ARTE =
  'Sem problema! Para a arte ficar boa, sugiro pedir para um designer ou usar uma ferramenta de sua preferência (Canva, por exemplo). Exporte em PDF, JPG, PNG ou TIFF e me envia quando estiver pronto.';

export class ValidarArquivoHandler implements StateHandler {
  async handle(
    message: string,
    sessao: SessaoRecord,
    deps: HandlerDeps
  ): Promise<HandlerResult> {
    const { context: prepared } = prepareContext(message, sessao, deps);
    const context: ConversationContext = { ...prepared };
    const msg = message.trim();

    if (ENVIA_DEPOIS_RE.test(msg)) {
      return {
        response: 'Tudo bem! Quando a arte estiver pronta, é só me enviar que eu retomo daqui.',
        nextState: ConversationState.AGUARDAR_RETORNO,
        updatedContext: context,
      };
    }

    if (SEM_ARTE_RE.test(msg)) {
      return {
        response: ORIENTACAO_SEM_ARTE,
        nextState: ConversationState.VALIDAR_ARQUIVO,
        updatedContext: context,
      };
    }

    if (ARTE_PRONTA_RE.test(msg)) {
      context.validacaoArteOk = true;
      return {
        response: '',
        nextState: ConversationState.CALCULAR_ORCAMENTO,
        updatedContext: context,
        chainNext: ConversationState.CALCULAR_ORCAMENTO,
      };
    }

    // Resposta ambígua — re-pergunta no formato do .md.
    return {
      response: 'Você já tem o arquivo de arte pronto para enviar? Aceitamos PDF, JPG, PNG ou TIFF.',
      nextState: ConversationState.VALIDAR_ARQUIVO,
      updatedContext: context,
    };
  }
}

export const validarArquivoHandler = new ValidarArquivoHandler();
