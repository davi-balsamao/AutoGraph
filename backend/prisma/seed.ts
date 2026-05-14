import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  // Upsert Cliente Mock Flutter (usr-client-001)
  const cliente = await prisma.usuario.upsert({
    where: { email: 'cliente@exemplo.com' },
    update: {},
    create: {
      id: 'usr-client-001',
      nome: 'Cliente Exemplo',
      email: 'cliente@exemplo.com',
      telefone: '11999990001',
      senha: 'senha_segura_cliente',
      role: 'CLIENTE',
    },
  });
  console.log(`Created/Updated cliente: ${cliente.nome}`);

  // Upsert Cliente Fallback Flutter (c1)
  const clienteC1 = await prisma.usuario.upsert({
    where: { email: 'c1@exemplo.com' },
    update: {},
    create: {
      id: 'c1',
      nome: 'Cliente Fallback',
      email: 'c1@exemplo.com',
      telefone: '11999990002',
      senha: 'senha_segura_cliente',
      role: 'CLIENTE',
    },
  });
  console.log(`Created/Updated cliente fallback: ${clienteC1.nome}`);

  // Upsert Gerente Mock Flutter (usr-admin-001)
  const gerente = await prisma.usuario.upsert({
    where: { email: 'admin@autograph.com' },
    update: {},
    create: {
      id: 'usr-admin-001',
      nome: 'Gerente AutoGraph',
      email: 'admin@autograph.com',
      telefone: '11999990000',
      senha: 'senha_segura_gerente',
      role: 'GERENTE',
    },
  });
  console.log(`Created/Updated gerente: ${gerente.nome}`);

  // Upsert Produtos do Catálogo
  const produtos = [
    {
      nome: 'Cartão de Visita',
      descricao: 'Cartões de visita premium em papel Couchê 300g com diversas opções de acabamento profissional.',
      precoBase: 75.00,
      imagemUrl: 'https://images.unsplash.com/photo-1589053075673-82a1548e6c71?w=600&auto=format&fit=crop&q=80',
    },
    {
      nome: 'Panfleto',
      descricao: 'Divulgue sua marca com panfletos e flyers de alta qualidade nos papéis Couchê 90g ou 115g.',
      precoBase: 120.00,
      imagemUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80',
    },
    {
      nome: 'Bloco',
      descricao: 'Blocos de notas e receituários personalizados, numerados ou com vias autocopiativas.',
      precoBase: 45.00,
      imagemUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&auto=format&fit=crop&q=80',
    },
    {
      nome: 'Banner em Lona',
      descricao: 'Banners de alta durabilidade em lona resistente com acabamento em ilhós ou madeira e corda.',
      precoBase: 90.00,
      imagemUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop&q=80',
    },
    {
      nome: 'Apostila',
      descricao: 'Impressão e encadernação de apostilas, manuais e materiais didáticos com acabamento Wire-o ou Espiral.',
      precoBase: 35.00,
      imagemUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    },
  ];

  for (const prod of produtos) {
    const upsertedProd = await prisma.produto.upsert({
      where: { nome: prod.nome },
      update: {
        descricao: prod.descricao,
        precoBase: prod.precoBase,
        imagemUrl: prod.imagemUrl,
      },
      create: prod,
    });
    console.log(`Created/Updated produto: ${upsertedProd.nome}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
