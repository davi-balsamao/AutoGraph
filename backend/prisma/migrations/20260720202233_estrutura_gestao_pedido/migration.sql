-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'SINAL_PAGO', 'PAGO', 'ESTORNADO');

-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO', 'BOLETO', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "ModalidadeEntrega" AS ENUM ('RETIRADA', 'ENTREGA');

-- CreateEnum
CREATE TYPE "TipoArquivo" AS ENUM ('ARTE_FINAL', 'ARTE_RASCUNHO', 'MOCKUP', 'COMPROVANTE_PAGAMENTO', 'OUTRO');

-- AlterTable
ALTER TABLE "Mensagens" ADD COLUMN     "mediaMimeType" TEXT,
ADD COLUMN     "mediaUrl" TEXT;

-- AlterTable
ALTER TABLE "OrdensDeServico" ADD COLUMN     "arteAprovadaId" TEXT,
ADD COLUMN     "codigoRastreio" TEXT,
ADD COLUMN     "dataEntregaPrevista" TIMESTAMP(3),
ADD COLUMN     "dataEntregaRealizada" TIMESTAMP(3),
ADD COLUMN     "desconto" DECIMAL(10,2),
ADD COLUMN     "enderecoEntregaId" TEXT,
ADD COLUMN     "freteValor" DECIMAL(10,2),
ADD COLUMN     "modalidadeEntrega" "ModalidadeEntrega" NOT NULL DEFAULT 'RETIRADA',
ADD COLUMN     "numero" SERIAL NOT NULL,
ADD COLUMN     "statusPagamento" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
ADD COLUMN     "transportadora" TEXT,
ADD COLUMN     "valorTotal" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "ItemOS" (
    "id" TEXT NOT NULL,
    "ordemId" TEXT NOT NULL,
    "produtoId" TEXT,
    "produtoNome" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitario" DECIMAL(10,2) NOT NULL,
    "precoTotal" DECIMAL(10,2) NOT NULL,
    "especificacoes" JSONB NOT NULL DEFAULT '{}',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemOS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" TEXT NOT NULL,
    "ordemId" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "metodo" "MetodoPagamento" NOT NULL,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "ehSinal" BOOLEAN NOT NULL DEFAULT false,
    "comprovanteUrl" TEXT,
    "pagoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArquivoOS" (
    "id" TEXT NOT NULL,
    "ordemId" TEXT NOT NULL,
    "tipo" "TipoArquivo" NOT NULL DEFAULT 'ARTE_FINAL',
    "url" TEXT NOT NULL,
    "nomeOriginal" TEXT,
    "mimeType" TEXT,
    "tamanhoBytes" INTEGER,
    "aprovado" BOOLEAN NOT NULL DEFAULT false,
    "enviadoPor" "OrigemMensagem" NOT NULL DEFAULT 'CLIENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArquivoOS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Endereco" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "apelido" TEXT,
    "cep" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "referencia" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Endereco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoStatusOS" (
    "id" TEXT NOT NULL,
    "ordemId" TEXT NOT NULL,
    "de" "StatusOS",
    "para" "StatusOS" NOT NULL,
    "alteradoPor" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoStatusOS_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemOS_ordemId_idx" ON "ItemOS"("ordemId");

-- CreateIndex
CREATE INDEX "ItemOS_produtoId_idx" ON "ItemOS"("produtoId");

-- CreateIndex
CREATE INDEX "Pagamento_ordemId_idx" ON "Pagamento"("ordemId");

-- CreateIndex
CREATE INDEX "Pagamento_status_idx" ON "Pagamento"("status");

-- CreateIndex
CREATE INDEX "ArquivoOS_ordemId_idx" ON "ArquivoOS"("ordemId");

-- CreateIndex
CREATE INDEX "Endereco_usuarioId_idx" ON "Endereco"("usuarioId");

-- CreateIndex
CREATE INDEX "HistoricoStatusOS_ordemId_idx" ON "HistoricoStatusOS"("ordemId");

-- CreateIndex
CREATE UNIQUE INDEX "OrdensDeServico_numero_key" ON "OrdensDeServico"("numero");

-- CreateIndex
CREATE INDEX "OrdensDeServico_status_idx" ON "OrdensDeServico"("status");

-- CreateIndex
CREATE INDEX "OrdensDeServico_clienteId_idx" ON "OrdensDeServico"("clienteId");

-- CreateIndex
CREATE INDEX "OrdensDeServico_criadoEm_idx" ON "OrdensDeServico"("criadoEm");

-- CreateIndex
CREATE INDEX "OrdensDeServico_statusPagamento_idx" ON "OrdensDeServico"("statusPagamento");

-- AddForeignKey
ALTER TABLE "OrdensDeServico" ADD CONSTRAINT "OrdensDeServico_enderecoEntregaId_fkey" FOREIGN KEY ("enderecoEntregaId") REFERENCES "Endereco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemOS" ADD CONSTRAINT "ItemOS_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "OrdensDeServico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemOS" ADD CONSTRAINT "ItemOS_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "OrdensDeServico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArquivoOS" ADD CONSTRAINT "ArquivoOS_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "OrdensDeServico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endereco" ADD CONSTRAINT "Endereco_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoStatusOS" ADD CONSTRAINT "HistoricoStatusOS_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "OrdensDeServico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

