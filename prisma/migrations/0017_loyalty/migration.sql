-- Loyalty points: per-provider programs + append-only scoped ledger.

CREATE TYPE "PointsReason" AS ENUM ('earned', 'redeemed', 'expired', 'adjustment');

-- Provider opt-in + earn rate (points per 100 ֏).
ALTER TABLE "shops"
  ADD COLUMN "loyalty_enabled" boolean NOT NULL DEFAULT false,
  ADD COLUMN "loyalty_points_per_100" integer NOT NULL DEFAULT 1;

ALTER TABLE "barbers"
  ADD COLUMN "loyalty_enabled" boolean NOT NULL DEFAULT false,
  ADD COLUMN "loyalty_points_per_100" integer NOT NULL DEFAULT 1;

CREATE TABLE "points_ledger" (
  "id"              uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id"         uuid NOT NULL,
  "booking_id"      uuid,
  "scope_shop_id"   uuid,
  "scope_barber_id" uuid,
  "delta"           integer NOT NULL,
  "reason"          "PointsReason" NOT NULL,
  "created_at"      timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "points_ledger_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "points_ledger"
  ADD CONSTRAINT "points_ledger_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "points_ledger"
  ADD CONSTRAINT "points_ledger_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "points_ledger"
  ADD CONSTRAINT "points_ledger_scope_shop_id_fkey"
  FOREIGN KEY ("scope_shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "points_ledger"
  ADD CONSTRAINT "points_ledger_scope_barber_id_fkey"
  FOREIGN KEY ("scope_barber_id") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One earn/expire row per booking → idempotent accrual.
CREATE UNIQUE INDEX "points_ledger_booking_id_reason_key" ON "points_ledger"("booking_id", "reason");
CREATE INDEX "points_ledger_user_scope_idx" ON "points_ledger"("user_id", "scope_shop_id", "scope_barber_id");
CREATE INDEX "points_ledger_user_id_created_at_idx" ON "points_ledger"("user_id", "created_at" DESC);
