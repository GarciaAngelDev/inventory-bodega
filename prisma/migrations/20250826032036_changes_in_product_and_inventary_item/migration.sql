/*
  Warnings:

  - You are about to drop the column `refCode` on the `InventaryItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[refCode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."InventaryItem_refCode_key";

-- AlterTable
ALTER TABLE "public"."InventaryItem" DROP COLUMN "refCode";

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "refCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_refCode_key" ON "public"."Product"("refCode");
