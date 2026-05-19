"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const client_1 = require("@prisma/client");
// O PrismaClient nativo lê automaticamente a variável DATABASE_URL do seu .env
// e gerencia as conexões de forma muito mais otimizada para o Node.js.
exports.prisma = new client_1.PrismaClient();
