/*
  Warnings:

  - You are about to drop the column `maxStock` on the `InventaryItem` table. All the data in the column will be lost.
  - You are about to drop the column `minStock` on the `InventaryItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."InventaryItem" DROP COLUMN "maxStock",
DROP COLUMN "minStock";

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "maxStock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "minStock" INTEGER NOT NULL DEFAULT 0;
