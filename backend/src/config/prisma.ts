import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// O PrismaClient nativo lê automaticamente a variável DATABASE_URL do seu .env
// e gerencia as conexões de forma muito mais otimizada para o Node.js.
export const prisma = new PrismaClient();
