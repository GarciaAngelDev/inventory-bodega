/*
  Warnings:

  - You are about to drop the column `inventaryItemId` on the `SaleDetail` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[refCode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."SaleDetail" DROP CONSTRAINT "SaleDetail_inventaryItemId_fkey";

-- AlterTable
ALTER TABLE "public"."SaleDetail" DROP COLUMN "inventaryItemId";

-- CreateTable
CREATE TABLE "public"."_InventaryItemToSaleDetail" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InventaryItemToSaleDetail_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_InventaryItemToSaleDetail_B_index" ON "public"."_InventaryItemToSaleDetail"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Product_refCode_key" ON "public"."Product"("refCode");

-- AddForeignKey
ALTER TABLE "public"."_InventaryItemToSaleDetail" ADD CONSTRAINT "_InventaryItemToSaleDetail_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."InventaryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_InventaryItemToSaleDetail" ADD CONSTRAINT "_InventaryItemToSaleDetail_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."SaleDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
