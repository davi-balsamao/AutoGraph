import { prisma } from '../config/prisma';
import { StatusOS } from '@prisma/client';

/**
 * Cancela OSs órfãs criadas pelo handler AGUARDAR_APROVACAO_ADMIN
 * que ficaram em AGUARDANDO_ORCAMENTO mas não têm sessão ativa correspondente.
 *
 * Causa: cliente resetou conversa ou bot avançou de estado, mas a OS
 * ficou registrada sem ninguém para aprovar.
 */
async function main() {
  console.log('🔍 Buscando OSs órfãs em AGUARDANDO_ORCAMENTO…');

  const oss = await prisma.ordensDeServico.findMany({
    where: { status: StatusOS.AGUARDANDO_ORCAMENTO },
  });

  console.log(`📋 Encontradas ${oss.length} OSs em AGUARDANDO_ORCAMENTO.`);

  let cancelled = 0;
  for (const os of oss) {
    const sessaoAtiva = await prisma.sessaoAtendimento.findFirst({
      where: {
        clienteId: os.clienteId,
        ativa: true,
        estadoAtual: 'AGUARDAR_APROVACAO_ADMIN',
      },
    });

    if (!sessaoAtiva) {
      await prisma.ordensDeServico.update({
        where: { id: os.id },
        data: { status: StatusOS.CANCELADA },
      });
      console.log(`  🗑️  OS ${os.id.substring(0, 8)} (cliente ${os.clienteId.substring(0, 8)}) → CANCELADA`);
      cancelled++;
    }
  }

  console.log(`\n✅ ${cancelled} OSs órfãs canceladas de ${oss.length} total.`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
