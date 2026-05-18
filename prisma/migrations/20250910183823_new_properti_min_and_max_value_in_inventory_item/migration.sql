-- AlterTable
ALTER TABLE "public"."InventaryItem" ADD COLUMN     "maxStock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "minStock" INTEGER NOT NULL DEFAULT 0;
