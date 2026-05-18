/*
  Warnings:

  - You are about to drop the column `weight` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[refCode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "weight",
ADD COLUMN     "refCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_refCode_key" ON "public"."Product"("refCode");
