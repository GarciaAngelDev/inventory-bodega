-- AlterTable
ALTER TABLE "public"."Sale" ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Setting" ADD COLUMN     "iva" DOUBLE PRECISION NOT NULL DEFAULT 0;
