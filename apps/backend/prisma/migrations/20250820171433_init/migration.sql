/*
  Warnings:

  - Added the required column `address` to the `Store` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Store" ADD COLUMN     "address" TEXT NOT NULL;
