/*
  Warnings:

  - The values [UND] on the enum `MeasureUnit` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "public"."InventaryStatus" ADD VALUE 'STOP';

-- AlterEnum
BEGIN;
CREATE TYPE "public"."MeasureUnit_new" AS ENUM ('KG', 'G', 'L', 'ML');
ALTER TABLE "public"."InputProduct" ALTER COLUMN "measureUnit" DROP DEFAULT;
ALTER TABLE "public"."InputProduct" ALTER COLUMN "measureUnit" TYPE "public"."MeasureUnit_new" USING ("measureUnit"::text::"public"."MeasureUnit_new");
ALTER TYPE "public"."MeasureUnit" RENAME TO "MeasureUnit_old";
ALTER TYPE "public"."MeasureUnit_new" RENAME TO "MeasureUnit";
DROP TYPE "public"."MeasureUnit_old";
ALTER TABLE "public"."InputProduct" ALTER COLUMN "measureUnit" SET DEFAULT 'KG';
COMMIT;

-- AlterEnum
ALTER TYPE "public"."SaleDetailStatus" ADD VALUE 'RETURNED';

-- AlterEnum
ALTER TYPE "public"."SaleStatus" ADD VALUE 'RETURNED';
