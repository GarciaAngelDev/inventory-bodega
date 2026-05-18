-- CreateEnum
CREATE TYPE "public"."ProductType" AS ENUM ('PRODUCT', 'RAWMATERIAL');

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "type" "public"."ProductType";
