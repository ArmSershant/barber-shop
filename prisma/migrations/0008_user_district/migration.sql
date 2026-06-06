-- Customer's home district (used to sort discovery by proximity).
ALTER TABLE "users" ADD COLUMN "preferred_district_id" SMALLINT;
