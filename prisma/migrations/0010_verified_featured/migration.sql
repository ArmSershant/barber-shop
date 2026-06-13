-- Verified badge + featured ranking for providers.
ALTER TABLE "shops" ADD COLUMN "is_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "shops" ADD COLUMN "is_featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "barbers" ADD COLUMN "is_featured" BOOLEAN NOT NULL DEFAULT false;
