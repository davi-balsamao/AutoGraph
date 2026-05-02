-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENTE', 'GERENTE');

-- CreateEnum
CREATE TYPE "StatusOS" AS ENUM ('CRIADA', 'EM_PRODUCAO', 'PRONTA_PARA_RETIRADA', 'ENTREGUE', 'CANCELADA');

-- CreateEnum
CREATE TYPE "OrigemMensagem" AS ENUM ('CLIENTE', 'BOT', 'GERENTE');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT NOT NULL,
    "senha" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CLIENTE',
    "fcmToken" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdensDeServico" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "status" "StatusOS" NOT NULL DEFAULT 'CRIADA',
    "especificacoes" JSONB NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdensDeServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensagens" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "ordemId" TEXT,
    "origem" "OrigemMensagem" NOT NULL,
    "payload" JSONB NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentosConhecimento" (
    "id" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "vetor" vector,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentosConhecimento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_telefone_key" ON "Usuario"("telefone");

-- AddForeignKey
ALTER TABLE "OrdensDeServico" ADD CONSTRAINT "OrdensDeServico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagens" ADD CONSTRAINT "Mensagens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagens" ADD CONSTRAINT "Mensagens_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "OrdensDeServico"("id") ON DELETE SET NULL ON UPDATE CASCADE;
