-- AlterTable
ALTER TABLE "DocumentosConhecimento" ADD COLUMN     "chunk_index" INTEGER,
ADD COLUMN     "doc_type" TEXT,
ADD COLUMN     "source" TEXT;
