"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStateInstructions = getStateInstructions;
exports.getRegrasGerais = getRegrasGerais;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const states_1 = require("./states");
const STATE_FILES = {
    [states_1.ConversationState.BOAS_VINDAS]: 'boas-vindas.md',
    [states_1.ConversationState.IDENTIFICAR_NECESSIDADE]: 'identificar-necessidade.md',
    [states_1.ConversationState.COLETAR_ESPECIFICACOES]: 'coletar-espec.md',
    [states_1.ConversationState.VALIDAR_ARQUIVO]: 'validar-arquivo.md',
    [states_1.ConversationState.CALCULAR_ORCAMENTO]: 'calcular-orcamento.md',
    [states_1.ConversationState.APRESENTAR_ORCAMENTO]: 'apresentar-orcamento.md',
    [states_1.ConversationState.AGUARDAR_APROVACAO]: 'aguardar-aprovacao.md',
    [states_1.ConversationState.NEGOCIAR]: 'negociar.md',
    [states_1.ConversationState.COLETAR_DADOS_ENTREGA]: 'dados-entrega.md',
    [states_1.ConversationState.CONFIRMAR_PEDIDO]: 'confirmar-pedido.md',
    [states_1.ConversationState.GERAR_OS]: 'gerar-os.md',
    [states_1.ConversationState.ESCLARECER_DUVIDA]: 'esclarecer-duvida.md',
    [states_1.ConversationState.PRODUTO_INDISPONIVEL]: 'produto-indisponivel.md',
    [states_1.ConversationState.ESCALAR_HUMANO]: 'escalar-humano.md',
    [states_1.ConversationState.AGUARDAR_RETORNO]: 'aguardar-retorno.md',
    [states_1.ConversationState.ENCERRAR]: 'encerrar.md',
};
let regrasGeraisCache = null;
function loadRegrasGerais() {
    if (regrasGeraisCache)
        return regrasGeraisCache;
    const p = path.join(__dirname, '../../rag-test/regras-gerais/regras-gerais.md');
    regrasGeraisCache = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    return regrasGeraisCache;
}
function getStateInstructions(state) {
    const fileName = STATE_FILES[state];
    if (!fileName)
        return '';
    const filePath = path.join(__dirname, '../../rag-test/estados', fileName);
    if (!fs.existsSync(filePath))
        return '';
    return fs.readFileSync(filePath, 'utf8');
}
function getRegrasGerais() {
    return loadRegrasGerais();
}
