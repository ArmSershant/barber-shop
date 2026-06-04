-- Canonical service-type catalog: translatable type key on services,
-- snapshotted onto booking line items.

ALTER TABLE "services" ADD COLUMN "type" TEXT;
ALTER TABLE "booking_services" ADD COLUMN "type_snapshot" TEXT;
