-- Owner-managed marketing: promo % (time-boxed), first-visit %, waitlist opt-in.

ALTER TABLE "shops"
  ADD COLUMN "promo_percent" integer NOT NULL DEFAULT 0,
  ADD COLUMN "promo_starts_at" timestamptz(6),
  ADD COLUMN "promo_ends_at" timestamptz(6),
  ADD COLUMN "first_visit_percent" integer NOT NULL DEFAULT 0,
  ADD COLUMN "waitlist_enabled" boolean NOT NULL DEFAULT true;

ALTER TABLE "barbers"
  ADD COLUMN "promo_percent" integer NOT NULL DEFAULT 0,
  ADD COLUMN "promo_starts_at" timestamptz(6),
  ADD COLUMN "promo_ends_at" timestamptz(6),
  ADD COLUMN "first_visit_percent" integer NOT NULL DEFAULT 0,
  ADD COLUMN "waitlist_enabled" boolean NOT NULL DEFAULT true;
