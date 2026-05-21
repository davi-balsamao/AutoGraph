/**
 * Handler do estado VALIDAR_ARQUIVO.
 *
 * Contrato ([rag-test/estados/validar-arquivo.md]):
 *  • Perguntar de forma simples: "Você já tem o arquivo de arte pronto?"
 *  • Informar formatos aceitos: PDF, JPG, PNG, TIFF
 *  • NÃO pedir DPI/resolução/sangria ao cliente
 *  • Se tem arte → CALCULAR_ORCAMENTO
 *  • Se não tem → orientar, permanece no estado
 *  • Se vai enviar depois → AGUARDAR_RETORNO
 */

import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationContext, ConversationState, SessaoRecord } from '../states';
import { DUVIDA } from '../transition.service';
import { prepareContext } from './base.handler';

const ARTE_PRONTA_RE =
  /\b(sim|tenho|j[áa] tenho|est[áa] pronto|est[áa] pronta|pronta|pronto|finalizad[oa]|enviei|reenviei|mandei|anexei|segue|pode usar)\b/i;

const SEM_ARTE_RE =
  /\b(n[ãa]o tenho|n[ãa]o tem|sem arte|n[ãa]o (estou |to )?com a arte|preciso (fazer|criar)|n[ãa]o sei (fazer|criar))\b/i;

const ENVIA_DEPOIS_RE =
  /\b(envio depois|envia depois|mando depois|te mando|enviar depois|depois te (mando|envio)|amanh[ãa]|na pr[óo]xima|outro dia)\b/i;

const INCOMPATIBLE_FORMAT_RE =
  /\b(psd|ai|cdr|indd|photoshop|illustrator|corel|coreldraw)\b/i;

const FORMATO_RE =
  /\b(exportar|pdf|jpg|png|tiff|formato|extens[ãa]o|extensao|aguardar|esperar|salvar)\b/i;

const ORIENTACAO_SEM_ARTE =
  'Sem problema! Para a arte ficar boa, sugiro pedir para um designer ou usar uma ferramenta de sua preferência (Canva, por exemplo). Exporte em PDF, JPG, PNG ou TIFF e me envia quando estiver pronto.';

export class ValidarArquivoHandler implements StateHandler {
  async handle(
    message: string,
    sessao: SessaoRecord,
    deps: HandlerDeps
  ): Promise<HandlerResult> {
    const { context: prepared } = await prepareContext(message, sessao, deps);
    const context: ConversationContext = { ...prepared };
    const msg = message.trim();

    if (INCOMPATIBLE_FORMAT_RE.test(msg)) {
      return {
        response:
          'Formatos de softwares de edição (como .PSD, .AI, .CDR) não são aceitos diretamente. Por favor, salve ou exporte seu arquivo em PDF, JPG, PNG ou TIFF antes de enviar!',
        nextState: ConversationState.VALIDAR_ARQUIVO,
        updatedContext: context,
      };
    }

    // Importante: precisa vir antes de ARTE_PRONTA_RE,
    // porque "Não tenho arte" também contém a palavra "tenho".
    if (SEM_ARTE_RE.test(msg)) {
      return {
        response: ORIENTACAO_SEM_ARTE,
        nextState: ConversationState.VALIDAR_ARQUIVO,
        updatedContext: context,
      };
    }

    if (ENVIA_DEPOIS_RE.test(msg)) {
      return {
        response: 'Tudo bem! Quando a arte estiver pronta, é só me enviar que eu retomo daqui.',
        nextState: ConversationState.AGUARDAR_RETORNO,
        updatedContext: context,
      };
    }

    if (ARTE_PRONTA_RE.test(msg)) {
      context.validacaoArteOk = true;

      const pendentes = context.specsPendentes || [];

      if (pendentes.length > 0) {
        return {
          response: `Antes de calcular, preciso confirmar: ${pendentes[0]}`,
          nextState: ConversationState.COLETAR_ESPECIFICACOES,
          updatedContext: context,
        };
      }

      return {
        response: '',
        nextState: ConversationState.CALCULAR_ORCAMENTO,
        updatedContext: context,
        chainNext: ConversationState.CALCULAR_ORCAMENTO,
      };
    }

    if (DUVIDA.test(msg) || FORMATO_RE.test(msg)) {
      return {
        response: '',
        nextState: ConversationState.ESCLARECER_DUVIDA,
        updatedContext: context,
        chainNext: ConversationState.ESCLARECER_DUVIDA,
      };
    }

    return {
      response: 'Você já tem o arquivo de arte pronto para enviar? Aceitamos PDF, JPG, PNG ou TIFF.',
      nextState: ConversationState.VALIDAR_ARQUIVO,
      updatedContext: context,
    };
  }
}

export const validarArquivoHandler = new ValidarArquivoHandler();