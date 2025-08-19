/*
  Warnings:

  - Added the required column `salesmanId` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Sale" ADD COLUMN     "salesmanId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."Salesman" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "storeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Salesman_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Salesman" ADD CONSTRAINT "Salesman_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_salesmanId_fkey" FOREIGN KEY ("salesmanId") REFERENCES "public"."Salesman"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
