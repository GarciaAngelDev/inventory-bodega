-- CreateEnum
CREATE TYPE "public"."ProducerStatus" AS ENUM ('IN_PRODUCTION', 'PAUSED', 'CANCELLED', 'FINISHED', 'PRODUCED');

-- CreateTable
CREATE TABLE "public"."Producer" (
    "id" TEXT NOT NULL,
    "status" "public"."ProducerStatus" NOT NULL DEFAULT 'PRODUCED',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProducerDetail" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "measureUnitValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "producerId" TEXT NOT NULL,

    CONSTRAINT "ProducerDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_InventaryItemToProducerDetail" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InventaryItemToProducerDetail_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_InventaryItemToProducerDetail_B_index" ON "public"."_InventaryItemToProducerDetail"("B");

-- AddForeignKey
ALTER TABLE "public"."Producer" ADD CONSTRAINT "Producer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProducerDetail" ADD CONSTRAINT "ProducerDetail_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "public"."Producer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_InventaryItemToProducerDetail" ADD CONSTRAINT "_InventaryItemToProducerDetail_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."InventaryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_InventaryItemToProducerDetail" ADD CONSTRAINT "_InventaryItemToProducerDetail_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."ProducerDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
