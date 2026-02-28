-- Notes: drop tags and updatedAt, add url
ALTER TABLE "Note" DROP COLUMN IF EXISTS "tags";
ALTER TABLE "Note" DROP COLUMN IF EXISTS "updatedAt";
ALTER TABLE "Note" ADD COLUMN IF NOT EXISTS "url" TEXT;

-- Books: add publishedDate (nullable) and updatedAt (with default for existing rows)
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "publishedDate" TIMESTAMP(3);
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Gallery: copy imageUrl to photoUrl, add description, drop old columns
ALTER TABLE "Gallery" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
UPDATE "Gallery" SET "photoUrl" = "imageUrl" WHERE "photoUrl" IS NULL AND "imageUrl" IS NOT NULL;
ALTER TABLE "Gallery" ALTER COLUMN "photoUrl" SET NOT NULL;
ALTER TABLE "Gallery" ADD COLUMN IF NOT EXISTS "description" TEXT;
UPDATE "Gallery" SET "description" = "title" WHERE "description" IS NULL;
ALTER TABLE "Gallery" DROP COLUMN IF EXISTS "imageUrl";
ALTER TABLE "Gallery" DROP COLUMN IF EXISTS "category";
ALTER TABLE "Gallery" DROP COLUMN IF EXISTS "title";
