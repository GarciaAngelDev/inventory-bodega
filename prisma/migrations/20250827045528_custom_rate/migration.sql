-- AlterEnum
ALTER TYPE "public"."RateType" ADD VALUE 'CUSTOM';

-- AlterTable
ALTER TABLE "public"."Setting" ADD COLUMN     "rateCustom" DOUBLE PRECISION NOT NULL DEFAULT 0;
