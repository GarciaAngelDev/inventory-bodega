-- AlterTable
ALTER TABLE "public"."Combo" ADD COLUMN     "count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."ComboItem" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 0;
