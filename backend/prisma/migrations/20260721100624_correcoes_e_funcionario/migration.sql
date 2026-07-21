-- CreateEnum
CREATE TYPE "EstadoConversa" AS ENUM ('BOAS_VINDAS', 'IDENTIFICAR_NECESSIDADE', 'COLETAR_ESPECIFICACOES', 'VALIDAR_ARQUIVO', 'CALCULAR_ORCAMENTO', 'AGUARDAR_APROVACAO_ADMIN', 'APRESENTAR_ORCAMENTO', 'AGUARDAR_APROVACAO', 'NEGOCIAR', 'COLETAR_DADOS_ENTREGA', 'CONFIRMAR_PEDIDO', 'GERAR_OS', 'ESCLARECER_DUVIDA', 'PRODUTO_INDISPONIVEL', 'ESCALAR_HUMANO', 'AGUARDAR_RETORNO', 'ENCERRAR');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'FUNCIONARIO';

-- AlterTable: atualizadoEm com default temporário p/ backfillar linhas existentes, depois remove (padrão Prisma)
ALTER TABLE "ArquivoOS" ADD COLUMN "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ArquivoOS" ALTER COLUMN "atualizadoEm" DROP DEFAULT;

ALTER TABLE "Endereco" ADD COLUMN "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Endereco" ALTER COLUMN "atualizadoEm" DROP DEFAULT;

ALTER TABLE "ItemOS" ADD COLUMN "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ItemOS" ALTER COLUMN "atualizadoEm" DROP DEFAULT;

-- AlterTable
ALTER TABLE "OrdensDeServico" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "enderecoEntregaSnapshot" JSONB,
ADD COLUMN "responsavelId" TEXT;

-- AlterTable
ALTER TABLE "Pagamento" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Pagamento" ALTER COLUMN "atualizadoEm" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Produto" ADD COLUMN "deletedAt" TIMESTAMP(3),
ALTER COLUMN "precoBase" SET DATA TYPE DECIMAL(10,2);

-- AlterTable: cast seguro String -> EstadoConversa (preserva dados existentes)
ALTER TABLE "SessaoAtendimento" ALTER COLUMN "estadoAtual" DROP DEFAULT;
ALTER TABLE "SessaoAtendimento" ALTER COLUMN "estadoAtual" TYPE "EstadoConversa" USING ("estadoAtual"::text::"EstadoConversa");
ALTER TABLE "SessaoAtendimento" ALTER COLUMN "estadoAtual" SET DEFAULT 'BOAS_VINDAS';
ALTER TABLE "SessaoAtendimento" ALTER COLUMN "estadoAnterior" TYPE "EstadoConversa" USING ("estadoAnterior"::text::"EstadoConversa");

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "HistoricoStatusOS_alteradoPor_idx" ON "HistoricoStatusOS"("alteradoPor");
CREATE INDEX "Mensagens_usuarioId_idx" ON "Mensagens"("usuarioId");
CREATE INDEX "Mensagens_ordemId_idx" ON "Mensagens"("ordemId");
CREATE INDEX "Mensagens_criadoEm_idx" ON "Mensagens"("criadoEm");
CREATE INDEX "OrdensDeServico_responsavelId_idx" ON "OrdensDeServico"("responsavelId");

-- CreateIndex: unico parcial (1 sessao ativa por cliente) -- nao expressavel no schema Prisma
CREATE UNIQUE INDEX "SessaoAtendimento_clienteId_ativa_key" ON "SessaoAtendimento"("clienteId") WHERE "ativa";

-- AddForeignKey
ALTER TABLE "OrdensDeServico" ADD CONSTRAINT "OrdensDeServico_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrdensDeServico" ADD CONSTRAINT "OrdensDeServico_arteAprovadaId_fkey" FOREIGN KEY ("arteAprovadaId") REFERENCES "ArquivoOS"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HistoricoStatusOS" ADD CONSTRAINT "HistoricoStatusOS_alteradoPor_fkey" FOREIGN KEY ("alteradoPor") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
