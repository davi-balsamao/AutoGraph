/*
  Warnings:

  - A unique constraint covering the columns `[nome]` on the table `Produto` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "atendimentoHumano" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SessaoAtendimento" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "estadoAtual" TEXT NOT NULL DEFAULT 'BOAS_VINDAS',
    "estadoAnterior" TEXT,
    "contexto" JSONB NOT NULL DEFAULT '{}',
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "lembreteEnviado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessaoAtendimento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessaoAtendimento_clienteId_ativa_idx" ON "SessaoAtendimento"("clienteId", "ativa");

-- CreateIndex
CREATE UNIQUE INDEX "Produto_nome_key" ON "Produto"("nome");

-- AddForeignKey
ALTER TABLE "SessaoAtendimento" ADD CONSTRAINT "SessaoAtendimento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
