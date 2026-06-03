-- Guest bookings: a booking is tied to a registered customer OR guest contact.

ALTER TABLE "bookings"
    ALTER COLUMN "customer_user_id" DROP NOT NULL,
    ADD COLUMN "guest_name" TEXT,
    ADD COLUMN "guest_phone" TEXT,
    ADD COLUMN "guest_email" TEXT,
    ADD COLUMN "manage_token" TEXT;

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_check"
    CHECK (
        "customer_user_id" IS NOT NULL
        OR ("guest_name" IS NOT NULL AND "guest_phone" IS NOT NULL)
    );

CREATE INDEX "bookings_manage_token_idx" ON "bookings" ("manage_token");
