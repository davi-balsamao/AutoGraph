"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient();
async function main() {
    const cliente = await prisma.usuario.findFirst({ where: { role: 'CLIENTE' } });
    if (!cliente) {
        console.log('Rode npm run seed primeiro.');
        return;
    }
    await prisma.ordensDeServico.create({
        data: {
            clienteId: cliente.id,
            status: client_1.StatusOS.AGUARDANDO_ORCAMENTO,
            especificacoes: { produto: 'Cartões de Visita', quantidade: 1000, papel: 'Couchê 300g' },
            mensagem_sugerida: 'Olá! Segue o orçamento dos cartões.',
        }
    });
    console.log('OS Fictícia criada com sucesso!');
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
