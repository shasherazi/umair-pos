-- CreateEnum
CREATE TYPE "public"."SaleType" AS ENUM ('CASH', 'CREDIT');

-- AlterTable
ALTER TABLE "public"."Sale" ADD COLUMN     "saleType" "public"."SaleType" NOT NULL DEFAULT 'CASH',
ADD COLUMN     "shopId" INTEGER;

-- CreateTable
CREATE TABLE "public"."Shop" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "storeId" INTEGER NOT NULL,
    "firstSaleDate" TIMESTAMP(3),
    "cashPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Shop" ADD CONSTRAINT "Shop_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
