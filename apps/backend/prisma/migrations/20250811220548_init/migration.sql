/*
  Warnings:

  - Made the column `shopId` on table `Sale` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Sale" DROP CONSTRAINT "Sale_shopId_fkey";

-- AlterTable
ALTER TABLE "public"."Sale" ALTER COLUMN "shopId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
