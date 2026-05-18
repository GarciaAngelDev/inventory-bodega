-- CreateEnum
CREATE TYPE "public"."ProducerDetailStatus" AS ENUM ('IN_PRODUCTION', 'PAUSED', 'CANCELLED', 'FINISHED', 'PRODUCED');

-- AlterTable
ALTER TABLE "public"."ProducerDetail" ADD COLUMN     "status" "public"."ProducerDetailStatus" NOT NULL DEFAULT 'PRODUCED';
