-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "measureUnitValue" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."RawMaterial" ADD COLUMN     "maxQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "minQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0;
