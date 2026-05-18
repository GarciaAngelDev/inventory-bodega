/*
  Warnings:

  - You are about to drop the column `rawMaterialId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `RawMaterial` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "public"."MeasureUnit" ADD VALUE 'UND';

-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_rawMaterialId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SaleDetail" DROP CONSTRAINT "SaleDetail_inventaryItemId_fkey";

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "rawMaterialId",
ADD COLUMN     "inputProductId" TEXT;

-- DropTable
DROP TABLE "public"."RawMaterial";

-- CreateTable
CREATE TABLE "public"."InputProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "measureUnit" "public"."MeasureUnit" NOT NULL DEFAULT 'KG',
    "minQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "public"."Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InputProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InputProduct_name_key" ON "public"."InputProduct"("name");

-- AddForeignKey
ALTER TABLE "public"."SaleDetail" ADD CONSTRAINT "SaleDetail_inventaryItemId_fkey" FOREIGN KEY ("inventaryItemId") REFERENCES "public"."InventaryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_inputProductId_fkey" FOREIGN KEY ("inputProductId") REFERENCES "public"."InputProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
