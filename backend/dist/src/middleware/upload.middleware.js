"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const crypto_1 = __importDefault(require("crypto"));
// Define o diretório absoluto para os uploads
const uploadDir = path_1.default.resolve(__dirname, '../../data/uploads');
// Garante que o diretório exista fisicamente
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Mapeamento seguro de MIME Types para extensões autorizadas
const allowedMimeTypes = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'application/pdf': '.pdf',
};
// Configuração do Storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Descartamos totalmente o nome original para prevenir Path Traversal e injeção
        const safeExtension = allowedMimeTypes[file.mimetype] || '.bin';
        const uniqueName = crypto_1.default.randomUUID() + safeExtension;
        cb(null, uniqueName);
    },
});
// Filtro de Arquivos focado em Segurança
const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes[file.mimetype]) {
        cb(null, true);
    }
    else {
        cb(new Error('Tipo de arquivo não suportado. Envie apenas JPG, PNG ou PDF.'));
    }
};
// Configuração e exportação do middleware Multer com limite de 10 MB
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
    fileFilter,
});
