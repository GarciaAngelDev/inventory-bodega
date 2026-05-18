-- CreateEnum
CREATE TYPE "public"."RateType" AS ENUM ('OFICIAL', 'PARALELO');

-- DropForeignKey
ALTER TABLE "public"."Inventary" DROP CONSTRAINT "Inventary_userId_fkey";

-- CreateTable
CREATE TABLE "public"."Setting" (
    "id" TEXT NOT NULL,
    "enableRate" BOOLEAN NOT NULL DEFAULT false,
    "rateType" "public"."RateType" NOT NULL DEFAULT 'OFICIAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Inventary" ADD CONSTRAINT "Inventary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
