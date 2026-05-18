/*
  Warnings:

  - You are about to drop the column `invoiceNumber` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Sale` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Sale" DROP COLUMN "invoiceNumber",
DROP COLUMN "name";
