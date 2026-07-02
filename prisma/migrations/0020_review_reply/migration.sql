-- Provider reply to a customer review.

ALTER TABLE "reviews"
  ADD COLUMN "reply" text,
  ADD COLUMN "replied_at" timestamptz(6);
