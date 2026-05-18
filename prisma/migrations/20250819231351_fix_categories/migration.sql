-- AlterTable
ALTER TABLE "public"."Category" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "slug" DROP NOT NULL;
