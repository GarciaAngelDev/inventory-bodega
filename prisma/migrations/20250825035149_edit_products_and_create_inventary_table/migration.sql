/*
  Warnings:

  - The values [USER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `refCode` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `retailPrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `wholesalePrice` on the `Product` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."InventaryItemStatus" AS ENUM ('AVAILABLE', 'OUT_OF_STOCK', 'RESERVED');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."UserRole_new" AS ENUM ('SUPER', 'ADMIN', 'COLABORATOR');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."User" ALTER COLUMN "role" TYPE "public"."UserRole_new" USING ("role"::text::"public"."UserRole_new");
ALTER TYPE "public"."UserRole" RENAME TO "UserRole_old";
ALTER TYPE "public"."UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "public"."User" ALTER COLUMN "role" SET DEFAULT 'COLABORATOR';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."ProductCharacteristics" DROP CONSTRAINT "ProductCharacteristics_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductCharacteristicsItem" DROP CONSTRAINT "ProductCharacteristicsItem_productCharacteristicsId_fkey";

-- DropIndex
DROP INDEX "public"."Product_refCode_key";

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "refCode",
DROP COLUMN "retailPrice",
DROP COLUMN "stock",
DROP COLUMN "wholesalePrice";

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "role" SET DEFAULT 'COLABORATOR';

-- CreateTable
CREATE TABLE "public"."Inventary" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventaryItem" (
    "id" TEXT NOT NULL,
    "refCode" TEXT,
    "retailPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "wholesalePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."InventaryItemStatus" NOT NULL DEFAULT 'AVAILABLE',
    "inventaryId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "InventaryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventaryItem_refCode_key" ON "public"."InventaryItem"("refCode");

-- AddForeignKey
ALTER TABLE "public"."InventaryItem" ADD CONSTRAINT "InventaryItem_inventaryId_fkey" FOREIGN KEY ("inventaryId") REFERENCES "public"."Inventary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventaryItem" ADD CONSTRAINT "InventaryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductCharacteristics" ADD CONSTRAINT "ProductCharacteristics_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductCharacteristicsItem" ADD CONSTRAINT "ProductCharacteristicsItem_productCharacteristicsId_fkey" FOREIGN KEY ("productCharacteristicsId") REFERENCES "public"."ProductCharacteristics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
