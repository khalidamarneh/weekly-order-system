-- AlterTable
ALTER TABLE "public"."products" ALTER COLUMN "partNo" DROP NOT NULL,
ALTER COLUMN "costPrice" DROP NOT NULL,
ALTER COLUMN "markupPercentage" DROP NOT NULL,
ALTER COLUMN "salePrice" DROP NOT NULL;
