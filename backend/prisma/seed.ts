import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in your environment variables.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter }) as any;

async function main() {
  console.log('🚀 Start seeding...');

  // IDs dos usuários que precisamos limpar
  const userIdsToClean = ['usr-client-001', 'usr-client-mock', 'c1', 'usr-admin-mock'];

  // 0. LIMPEZA CIRÚRGICA: Remove as ordens vinculadas primeiro para evitar o erro P2003
  console.log('🧹 Removendo ordens de serviço antigas dos usuários de teste...');
  
  // Testamos as variações mais comuns de nome do modelo de ordens para garantir que o Prisma limpe a tabela certa
  const possiveisModelosDeOrdem = ['ordemServico', 'ordensDeServico', 'order', 'pedido'];
  
  for (const modelo of possiveisModelosDeOrdem) {
    try {
      await prisma[modelo].deleteMany({
        where: {
          clienteId: { in: userIdsToClean }
        }
      });
    } catch (e) {
      // Se o modelo não existir com esse nome no seu schema, ignora e tenta o próximo
    }
  }

  // Agora que as chaves estrangeiras foram limpas, podemos apagar os usuários com segurança
  console.log('👤 Removendo usuários de teste antigos...');
  await prisma.usuario.deleteMany({
    where: {
      OR: [
        { id: { in: userIdsToClean } },
        { email: 'admin@autograph.com' },
        { email: 'cliente@exemplo.com' },
        { email: 'clientemock@exemplo.com' },
        { email: 'c1@exemplo.com' }
      ]
    }
  });
  
  console.log('✨ Banco perfeitamente limpo para receber os novos dados!');

  // Gerando os hashes reais para o backend conseguir validar o login
  const senhaClienteHash = await bcrypt.hash('cliente123', 10);
  const senhaAdminHash = await bcrypt.hash('admin123', 10);

  // 1. Upsert Cliente Mock Flutter (usr-client-001)
  const cliente = await prisma.usuario.upsert({
    where: { id: 'usr-client-001' },
    update: { email: 'cliente@exemplo.com', senha: senhaClienteHash },
    create: {
      id: 'usr-client-001',
      nome: 'Cliente Exemplo',
      email: 'cliente@exemplo.com',
      telefone: '11999990001',
      senha: senhaClienteHash,
      role: 'CLIENTE',
    },
  });
  console.log(`✅ Created/Updated cliente: ${cliente.nome}`);

  // 1.2. Garante o ID 'usr-client-mock' limpo e pronto para a sessão do Flutter
  const clienteMockAtivo = await prisma.usuario.upsert({
    where: { id: 'usr-client-mock' },
    update: { senha: senhaClienteHash },
    create: {
      id: 'usr-client-mock',
      nome: 'Cliente Mock Ativo',
      email: 'clientemock@exemplo.com',
      telefone: '11999990003',
      senha: senhaClienteHash,
      role: 'CLIENTE',
    },
  });
  console.log(`✅ Created/Updated cliente mock de sessão: ${clienteMockAtivo.nome}`);

  // 2. Upsert Cliente Fallback Flutter (c1)
  const clienteC1 = await prisma.usuario.upsert({
    where: { id: 'c1' },
    update: { email: 'c1@exemplo.com', senha: senhaClienteHash },
    create: {
      id: 'c1',
      nome: 'Cliente Fallback',
      email: 'c1@exemplo.com',
      telefone: '11999990002',
      senha: senhaClienteHash,
      role: 'CLIENTE',
    },
  });
  console.log(`✅ Created/Updated cliente fallback: ${clienteC1.nome}`);

  // 3. Upsert Gerente Mock Flutter (usr-admin-mock)
  const gerente = await prisma.usuario.upsert({
    where: { id: 'usr-admin-mock' },
    update: { email: 'admin@autograph.com', senha: senhaAdminHash },
    create: {
      id: 'usr-admin-mock', 
      nome: 'Gerente AutoGraph',
      email: 'admin@autograph.com',
      telefone: '11999990000',
      senha: senhaAdminHash,
      role: 'GERENTE',
    },
  });
  console.log(`✅ Created/Updated gerente: ${gerente.nome}`);

  // 4. Upsert Produtos do Catálogo
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
    console.log(`📦 Created/Updated produto: ${upsertedProd.nome}`);
  }

  // 5. Upsert da Ordem de Serviço Perfeita vinculada ao Cliente da Sessão
  let osCriada = false;
  for (const modelo of possiveisModelosDeOrdem) {
    if (osCriada) break;
    try {
      const osPerfeita = await prisma[modelo].upsert({
        where: { id: 'pedido-teste-fcm-123' },
        update: {},
        create: {
          id: 'pedido-teste-fcm-123', 
          descricao: 'Apostilas de Treinamento e Produção Gráfica',
          total: 250.00,
          status: 'AGUARDANDO_ORCAMENTO',
          clienteId: 'usr-client-mock', 
        },
      });
      console.log(`📋 Created/Updated OS de Teste Assertiva no modelo "${modelo}": ${osPerfeita.id}`);
      osCriada = true;
    } catch (error) {
      // Avança se falhar
    }
  }

  if (!osCriada) {
    console.log('\n⚠️ Nota: Não foi possível estruturar a OS automática. Verifique a nomenclatura exata do modelo de ordens no seu schema.prisma.');
  }

  console.log('⭐ Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });