import fs from 'fs';
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';
import { Request } from 'express';

// Define o diretório absoluto para os uploads
const uploadDir = path.resolve(__dirname, '../../data/uploads');

// Garante que o diretório exista fisicamente
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Mapeamento seguro de MIME Types para extensões autorizadas
const allowedMimeTypes: { [key: string]: string } = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf',
};

// Configuração do Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Descartamos totalmente o nome original para prevenir Path Traversal e injeção
    const safeExtension = allowedMimeTypes[file.mimetype] || '.bin';
    const uniqueName = crypto.randomUUID() + safeExtension;
    cb(null, uniqueName);
  },
});

// Filtro de Arquivos focado em Segurança
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedMimeTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Envie apenas JPG, PNG ou PDF.'));
  }
};

// Configuração e exportação do middleware Multer com limite de 10 MB
export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter,
});
