/*
  Warnings:

  - You are about to drop the column `passwordHash` on the `Store` table. All the data in the column will be lost.
  - Added the required column `password` to the `Store` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Store" DROP COLUMN "passwordHash",
ADD COLUMN     "password" TEXT NOT NULL;
