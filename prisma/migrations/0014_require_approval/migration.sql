-- Per-provider booking approval: bookings against this provider start as
-- 'requested' and must be accepted, instead of auto-confirming.
ALTER TABLE "shops" ADD COLUMN "requires_approval" boolean NOT NULL DEFAULT false;
ALTER TABLE "barbers" ADD COLUMN "requires_approval" boolean NOT NULL DEFAULT false;
