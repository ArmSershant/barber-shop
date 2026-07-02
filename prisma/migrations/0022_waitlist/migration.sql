-- Waitlist: customers subscribe to a full day; notified when a slot frees up.

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'waitlist_slot';

CREATE TABLE "waitlist_entries" (
  "id"          uuid NOT NULL DEFAULT gen_random_uuid(),
  "barber_id"   uuid NOT NULL,
  "user_id"     uuid NOT NULL,
  "date"        text NOT NULL,
  "notified_at" timestamptz(6),
  "created_at"  timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "waitlist_entries"
  ADD CONSTRAINT "waitlist_entries_barber_id_fkey"
  FOREIGN KEY ("barber_id") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "waitlist_entries"
  ADD CONSTRAINT "waitlist_entries_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "waitlist_entries_barber_id_user_id_date_key"
  ON "waitlist_entries"("barber_id", "user_id", "date");
CREATE INDEX "waitlist_entries_barber_id_date_idx" ON "waitlist_entries"("barber_id", "date");
