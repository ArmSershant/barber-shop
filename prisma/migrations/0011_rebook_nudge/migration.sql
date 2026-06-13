-- Track when a "time to rebook" nudge was sent, to avoid repeats.
ALTER TABLE "bookings" ADD COLUMN "rebook_nudge_sent_at" TIMESTAMPTZ(6);
