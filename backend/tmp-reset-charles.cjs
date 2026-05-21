require("ts-node/register");

const { prisma } = require("./src/config/prisma");

async function main() {
  const telefone = "5512997118413";

  const usuario = await prisma.usuario.findUnique({
    where: { telefone }
  });

  if (!usuario) {
    console.log("Usuário não encontrado:", telefone);
    return;
  }

  await prisma.usuario.update({
    where: { telefone },
    data: { atendimentoHumano: false }
  });

  await prisma.sessaoAtendimento.updateMany({
    where: {
      clienteId: usuario.id,
      ativa: true
    },
    data: {
      estadoAtual: "BOAS_VINDAS",
      estadoAnterior: null,
      contexto: {},
      lembreteEnviado: false
    }
  });

  console.log("Sessão resetada para BOAS_VINDAS:", telefone);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
