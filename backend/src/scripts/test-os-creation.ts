import { prisma } from '../config/prisma';
import { StatusOS } from '@prisma/client';

async function testOsCreation() {
  console.log('🧪 Iniciando teste de criação de Ordem de Serviço na Área do Cliente...');

  try {
    // Busca o primeiro cliente disponível ou cria um de teste
    let cliente = await prisma.usuario.findFirst({
      where: { role: 'CLIENTE' }
    });

    if (!cliente) {
      cliente = await prisma.usuario.create({
        data: {
          nome: 'Cliente Teste OS',
          telefone: '5511999990000',
          email: 'cliente.teste@autograph.com',
          role: 'CLIENTE'
        }
      });
      console.log('👤 Cliente de teste criado:', cliente.id);
    } else {
      console.log('👤 Cliente existente selecionado:', cliente.id);
    }

    // Especificações simuladas do formulário/Wizard
    const especificacoesSimuladas = {
      produtoId: 'prod-mock',
      produtoNome: 'Cartão de Visita Premium',
      dimensoes: {
        largura: '9 cm',
        altura: '5 cm'
      },
      acabamento: 'Laminação Fosca',
      arteUrl: '/uploads/mock-arte-12345.jpg'
    };

    const observacoesSimuladas = 'Quero a arte exatamente centralizada com bordas arredondadas.';

    // Salva a OS no banco
    const novaOs = await prisma.ordensDeServico.create({
      data: {
        clienteId: cliente.id,
        status: StatusOS.CRIADA,
        especificacoes: especificacoesSimuladas,
        observacoes: observacoesSimuladas
      }
    });

    console.log('✅ SUCESSO: Ordem de Serviço persistida com sucesso no banco de dados!');
    console.log(JSON.stringify(novaOs, null, 2));

  } catch (error) {
    console.error('❌ Erro no teste de criação da OS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOsCreation();
