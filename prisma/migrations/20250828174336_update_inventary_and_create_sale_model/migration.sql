/*
  Warnings:

  - The `status` column on the `Inventary` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."InventaryStatus" AS ENUM ('PENDING', 'PREPARED', 'SOLD');

-- CreateEnum
CREATE TYPE "public"."SaleStatus" AS ENUM ('CANCELLED', 'RESERVED', 'SOLD');

-- CreateEnum
CREATE TYPE "public"."SaleDetailStatus" AS ENUM ('CANCELLED', 'RESERVED', 'SOLD');

-- AlterEnum
ALTER TYPE "public"."InventaryItemStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "public"."Inventary" ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "providerName" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."InventaryStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "public"."Sale" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "status" "public"."SaleStatus" NOT NULL DEFAULT 'SOLD',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SaleDetail" (
    "id" TEXT NOT NULL,
    "retailPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "wholesalePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."SaleDetailStatus" NOT NULL DEFAULT 'SOLD',
    "inventaryItemId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,

    CONSTRAINT "SaleDetail_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaleDetail" ADD CONSTRAINT "SaleDetail_inventaryItemId_fkey" FOREIGN KEY ("inventaryItemId") REFERENCES "public"."InventaryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaleDetail" ADD CONSTRAINT "SaleDetail_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
