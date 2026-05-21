-- AlterEnum
ALTER TYPE "StatusOS" ADD VALUE 'APROVADO';

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "enderecoCompleto" TEXT,
ADD COLUMN     "enderecoReferencia" TEXT;
