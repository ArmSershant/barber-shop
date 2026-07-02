-- Loyalty redemption config: ֏ value of a point + max % of a booking points cover.

ALTER TABLE "shops"
  ADD COLUMN "loyalty_amd_per_point" integer NOT NULL DEFAULT 1,
  ADD COLUMN "loyalty_max_redeem_pct" integer NOT NULL DEFAULT 50;

ALTER TABLE "barbers"
  ADD COLUMN "loyalty_amd_per_point" integer NOT NULL DEFAULT 1,
  ADD COLUMN "loyalty_max_redeem_pct" integer NOT NULL DEFAULT 50;
