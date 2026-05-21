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
exports.getCatalog = getCatalog;
exports.findCatalogProduct = findCatalogProduct;
exports.formatarPerguntaCatalogo = formatarPerguntaCatalogo;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let catalogCache = null;
function getCatalog() {
    if (catalogCache)
        return catalogCache;
    const catalogoPath = path.join(__dirname, '../../data/catalogo.json');
    const loaded = fs.existsSync(catalogoPath)
        ? JSON.parse(fs.readFileSync(catalogoPath, 'utf8'))
        : [];
    catalogCache = loaded;
    return loaded;
}
function findCatalogProduct(nome) {
    return getCatalog().find((i) => i.produto.toLowerCase() === nome.toLowerCase());
}
/** Formata pergunta do catálogo para envio (uma pergunta, texto oficial). */
function formatarPerguntaCatalogo(pergunta) {
    const t = pergunta.trim();
    return t.endsWith('?') ? t : `${t}?`;
}
