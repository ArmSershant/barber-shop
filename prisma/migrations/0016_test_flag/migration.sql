-- "Test" flag: hide internal/test providers from public discovery while
-- keeping them visible to admins.
ALTER TABLE "barbers" ADD COLUMN "is_test" boolean NOT NULL DEFAULT false;
ALTER TABLE "shops" ADD COLUMN "is_test" boolean NOT NULL DEFAULT false;
