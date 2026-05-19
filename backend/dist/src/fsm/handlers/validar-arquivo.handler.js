"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarArquivoHandler = exports.ValidarArquivoHandler = void 0;
const states_1 = require("../states");
const transition_service_1 = require("../transition.service");
const base_handler_1 = require("./base.handler");
const ARTE_PRONTA_RE = /\b(sim|tenho|j[áa] tenho|est[áa] pronto|est[áa] pronta|pronta|pronto|finalizad[oa]|enviei|reenviei|mandei|anexei|segue|pode usar)\b/i;
const SEM_ARTE_RE = /\b(n[ãa]o tenho|n[ãa]o tem|sem arte|n[ãa]o (estou |to )?com a arte|preciso (fazer|criar)|n[ãa]o sei (fazer|criar))\b/i;
const ENVIA_DEPOIS_RE = /\b(envio depois|envia depois|mando depois|te mando|enviar depois|depois te (mando|envio)|amanh[ãa]|na pr[óo]xima|outro dia)\b/i;
const INCOMPATIBLE_FORMAT_RE = /\b(psd|ai|cdr|indd|photoshop|illustrator|corel|coreldraw)\b/i;
const FORMATO_RE = /\b(exportar|pdf|jpg|png|tiff|formato|extensão|extensao|aguardar|esperar|salvar)\b/i;
const ORIENTACAO_SEM_ARTE = 'Sem problema! Para a arte ficar boa, sugiro pedir para um designer ou usar uma ferramenta de sua preferência (Canva, por exemplo). Exporte em PDF, JPG, PNG ou TIFF e me envia quando estiver pronto.';
class ValidarArquivoHandler {
    async handle(message, sessao, deps) {
        const { context: prepared } = await (0, base_handler_1.prepareContext)(message, sessao, deps);
        const context = { ...prepared };
        const msg = message.trim();
        if (INCOMPATIBLE_FORMAT_RE.test(msg)) {
            return {
                response: 'Formatos de softwares de edição (como .PSD, .AI, .CDR) não são aceitos diretamente. Por favor, salve ou exporte seu arquivo em PDF, JPG, PNG ou TIFF antes de enviar!',
                nextState: states_1.ConversationState.VALIDAR_ARQUIVO,
                updatedContext: context,
            };
        }
        if (ARTE_PRONTA_RE.test(msg)) {
            context.validacaoArteOk = true;
            return {
                response: '',
                nextState: states_1.ConversationState.CALCULAR_ORCAMENTO,
                updatedContext: context,
                chainNext: states_1.ConversationState.CALCULAR_ORCAMENTO,
            };
        }
        // Fluxo 4 / Formatos: cliente pergunta sobre preço ou discute formatos/exportação —
        // roteia para ESCLARECER_DUVIDA para que o RAG explique/oriente.
        if (transition_service_1.DUVIDA.test(msg) || FORMATO_RE.test(msg)) {
            return {
                response: '',
                nextState: states_1.ConversationState.ESCLARECER_DUVIDA,
                updatedContext: context,
                chainNext: states_1.ConversationState.ESCLARECER_DUVIDA,
            };
        }
        if (ENVIA_DEPOIS_RE.test(msg)) {
            return {
                response: 'Tudo bem! Quando a arte estiver pronta, é só me enviar que eu retomo daqui.',
                nextState: states_1.ConversationState.AGUARDAR_RETORNO,
                updatedContext: context,
            };
        }
        if (SEM_ARTE_RE.test(msg)) {
            return {
                response: ORIENTACAO_SEM_ARTE,
                nextState: states_1.ConversationState.VALIDAR_ARQUIVO,
                updatedContext: context,
            };
        }
        // Resposta ambígua — re-pergunta no formato do .md.
        return {
            response: 'Você já tem o arquivo de arte pronto para enviar? Aceitamos PDF, JPG, PNG ou TIFF.',
            nextState: states_1.ConversationState.VALIDAR_ARQUIVO,
            updatedContext: context,
        };
    }
}
exports.ValidarArquivoHandler = ValidarArquivoHandler;
exports.validarArquivoHandler = new ValidarArquivoHandler();
