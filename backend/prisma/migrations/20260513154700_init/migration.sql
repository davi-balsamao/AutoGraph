-- AlterEnum
ALTER TYPE "StatusOS" ADD VALUE 'AGUARDANDO_ORCAMENTO';

-- AlterTable
ALTER TABLE "OrdensDeServico" ADD COLUMN     "durationSeconds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "mensagem_sugerida" TEXT,
ADD COLUMN     "timerEndedAt" TIMESTAMP(3),
ADD COLUMN     "timerStartedAt" TIMESTAMP(3);
