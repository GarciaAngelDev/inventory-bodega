/*
  Warnings:

  - Added the required column `type` to the `InventaryItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."InventaryType" AS ENUM ('INTERNAL', 'SALE');

-- AlterTable
ALTER TABLE "public"."Inventary" ADD COLUMN     "type" "public"."InventaryType" NOT NULL DEFAULT 'SALE';

-- AlterTable
ALTER TABLE "public"."InventaryItem" ADD COLUMN     "type" "public"."InventaryType" NOT NULL;
