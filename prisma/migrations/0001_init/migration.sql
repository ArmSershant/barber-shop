-- Barber-Shop initial migration
-- Hand-written to match prisma/schema.prisma (Prisma engine binaries were not
-- reachable from the build environment, so this was not auto-generated).
--
-- Before relying on Prisma's migration history, verify this matches the schema:
--   pnpm prisma migrate diff --from-migrations prisma/migrations \
--     --to-schema-datamodel prisma/schema.prisma --exit-code
-- (exit code 0 = in sync). See docs/03 for the workflow.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended');
CREATE TYPE "Role" AS ENUM ('customer', 'barber', 'shop_owner', 'admin');
CREATE TYPE "ProviderStatus" AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE "BookingStatus" AS ENUM ('requested', 'confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE "CancelledBy" AS ENUM ('customer', 'provider', 'system');
CREATE TYPE "NotificationChannel" AS ENUM ('email', 'inapp', 'telegram', 'push', 'sms');
CREATE TYPE "NotificationType" AS ENUM ('booking_created', 'booking_confirmed', 'booking_cancelled', 'reminder', 'review_request');
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'past_due', 'cancelled');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" CITEXT NOT NULL,
    "password_hash" TEXT,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "avatar_url" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");

CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role" "Role" NOT NULL,
    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role")
);

CREATE TABLE "districts" (
    "id" SMALLSERIAL NOT NULL,
    "name_hy" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "districts_slug_key" ON "districts" ("slug");

CREATE TABLE "shops" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "district_id" SMALLINT,
    "address" TEXT,
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),
    "phone" TEXT,
    "instagram" TEXT,
    "status" "ProviderStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "shops_slug_key" ON "shops" ("slug");
CREATE INDEX "shops_district_id_status_idx" ON "shops" ("district_id", "status");

CREATE TABLE "barbers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shop_id" UUID,
    "user_id" UUID,
    "display_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "experience_years" SMALLINT,
    "photo_url" TEXT,
    "district_id" SMALLINT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Yerevan',
    "slot_granularity_min" SMALLINT NOT NULL DEFAULT 15,
    "default_buffer_min" SMALLINT NOT NULL DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "ProviderStatus" NOT NULL DEFAULT 'pending',
    "rating_avg" DECIMAL(2,1) NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    CONSTRAINT "barbers_pkey" PRIMARY KEY ("id"),
    -- A barber must be owned by a shop or a user (or both).
    CONSTRAINT "barbers_owner_check" CHECK ("shop_id" IS NOT NULL OR "user_id" IS NOT NULL)
);
CREATE UNIQUE INDEX "barbers_user_id_key" ON "barbers" ("user_id");
CREATE UNIQUE INDEX "barbers_slug_key" ON "barbers" ("slug");
CREATE INDEX "barbers_district_id_status_idx" ON "barbers" ("district_id", "status");
CREATE INDEX "barbers_rating_avg_idx" ON "barbers" ("rating_avg" DESC);

CREATE TABLE "services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shop_id" UUID,
    "owner_barber_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration_min" SMALLINT NOT NULL,
    "price_amd" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "services_pkey" PRIMARY KEY ("id"),
    -- Exactly one owner: a shop catalog OR an independent barber's catalog.
    CONSTRAINT "services_owner_check" CHECK (("shop_id" IS NOT NULL) <> ("owner_barber_id" IS NOT NULL))
);
CREATE INDEX "services_shop_id_idx" ON "services" ("shop_id");
CREATE INDEX "services_owner_barber_id_idx" ON "services" ("owner_barber_id");

CREATE TABLE "barber_services" (
    "barber_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "price_amd_override" INTEGER,
    "duration_min_override" SMALLINT,
    CONSTRAINT "barber_services_pkey" PRIMARY KEY ("barber_id", "service_id")
);

CREATE TABLE "working_hours" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "barber_id" UUID NOT NULL,
    "weekday" SMALLINT NOT NULL,
    "start_minute" SMALLINT NOT NULL,
    "end_minute" SMALLINT NOT NULL,
    CONSTRAINT "working_hours_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "working_hours_weekday_check" CHECK ("weekday" BETWEEN 0 AND 6),
    CONSTRAINT "working_hours_range_check" CHECK ("start_minute" >= 0 AND "end_minute" <= 1440 AND "start_minute" < "end_minute")
);
CREATE INDEX "working_hours_barber_id_weekday_idx" ON "working_hours" ("barber_id", "weekday");

CREATE TABLE "time_off" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "barber_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "reason" TEXT,
    CONSTRAINT "time_off_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "time_off_range_check" CHECK ("starts_at" < "ends_at")
);
CREATE INDEX "time_off_barber_id_starts_at_idx" ON "time_off" ("barber_id", "starts_at");

CREATE TABLE "bookings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_user_id" UUID NOT NULL,
    "barber_id" UUID NOT NULL,
    "shop_id" UUID,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'confirmed',
    "total_price_amd" INTEGER NOT NULL,
    "total_duration_min" SMALLINT NOT NULL,
    "customer_note" TEXT,
    "cancel_reason" TEXT,
    "cancelled_by" "CancelledBy",
    "reminder_sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "bookings_range_check" CHECK ("starts_at" < "ends_at")
);
CREATE INDEX "bookings_barber_id_starts_at_idx" ON "bookings" ("barber_id", "starts_at");
CREATE INDEX "bookings_customer_user_id_starts_at_idx" ON "bookings" ("customer_user_id", "starts_at" DESC);

-- The core guarantee: no two active bookings for the same barber may overlap.
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap_per_barber"
    EXCLUDE USING gist (
        "barber_id" WITH =,
        tstzrange("starts_at", "ends_at") WITH &&
    ) WHERE ("status" IN ('requested', 'confirmed'));

CREATE TABLE "booking_services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_id" UUID NOT NULL,
    "service_id" UUID,
    "name_snapshot" TEXT NOT NULL,
    "price_amd_snapshot" INTEGER NOT NULL,
    "duration_min_snapshot" SMALLINT NOT NULL,
    CONSTRAINT "booking_services_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "booking_services_booking_id_idx" ON "booking_services" ("booking_id");

CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_id" UUID NOT NULL,
    "barber_id" UUID NOT NULL,
    "customer_user_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);
CREATE UNIQUE INDEX "reviews_booking_id_key" ON "reviews" ("booking_id");
CREATE INDEX "reviews_barber_id_idx" ON "reviews" ("barber_id");

CREATE TABLE "portfolio_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "barber_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "portfolio_images_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "portfolio_images_barber_id_idx" ON "portfolio_images" ("barber_id");

CREATE TABLE "shop_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shop_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shop_photos_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "shop_photos_shop_id_idx" ON "shop_photos" ("shop_id");

CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'inapp',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "read_at" TIMESTAMPTZ(6),
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications" ("user_id", "read_at");

CREATE TABLE "favorites" (
    "user_id" UUID NOT NULL,
    "barber_id" UUID NOT NULL,
    CONSTRAINT "favorites_pkey" PRIMARY KEY ("user_id", "barber_id")
);

CREATE TABLE "plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_amd_month" INTEGER NOT NULL,
    "features" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "plans_code_key" ON "plans" ("code");

CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shop_id" UUID,
    "barber_id" UUID,
    "plan_id" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "current_period_start" TIMESTAMPTZ(6) NOT NULL,
    "current_period_end" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subscriptions_owner_check" CHECK (("shop_id" IS NOT NULL) <> ("barber_id" IS NOT NULL))
);
CREATE INDEX "subscriptions_shop_id_idx" ON "subscriptions" ("shop_id");
CREATE INDEX "subscriptions_barber_id_idx" ON "subscriptions" ("barber_id");

-- ---------------------------------------------------------------------------
-- Foreign keys
-- ---------------------------------------------------------------------------
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shops" ADD CONSTRAINT "shops_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shops" ADD CONSTRAINT "shops_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "barbers" ADD CONSTRAINT "barbers_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "barbers" ADD CONSTRAINT "barbers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "barbers" ADD CONSTRAINT "barbers_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "services" ADD CONSTRAINT "services_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "services" ADD CONSTRAINT "services_owner_barber_id_fkey" FOREIGN KEY ("owner_barber_id") REFERENCES "barbers" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "barber_services" ADD CONSTRAINT "barber_services_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "barbers" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "barber_services" ADD CONSTRAINT "barber_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "barbers" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "time_off" ADD CONSTRAINT "time_off_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "barbers" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_user_id_fkey" FOREIGN KEY ("customer_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "barbers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "booking_services" ADD CONSTRAINT "booking_services_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_services" ADD CONSTRAINT "booking_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "barbers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_user_id_fkey" FOREIGN KEY ("customer_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "portfolio_images" ADD CONSTRAINT "portfolio_images_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "barbers" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shop_photos" ADD CONSTRAINT "shop_photos_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "barbers" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
