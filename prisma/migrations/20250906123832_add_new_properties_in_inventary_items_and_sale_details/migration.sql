/*
  Warnings:

  - You are about to drop the column `initialMeasureUnitValue` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."InventaryItem" ADD COLUMN     "initialMeasureUnitValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "measureUnitValue" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "initialMeasureUnitValue";

-- AlterTable
ALTER TABLE "public"."SaleDetail" ADD COLUMN     "measureUnitValue" DOUBLE PRECISION NOT NULL DEFAULT 0;
