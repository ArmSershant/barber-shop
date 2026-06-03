-- Time-off status/approval fields + recurring breaks table.

CREATE TYPE "RequestStatus" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "RequestActor" AS ENUM ('barber', 'owner');

ALTER TABLE "time_off"
    ADD COLUMN "status" "RequestStatus" NOT NULL DEFAULT 'approved',
    ADD COLUMN "requested_by" "RequestActor" NOT NULL DEFAULT 'barber',
    ADD COLUMN "decided_by_id" UUID,
    ADD COLUMN "decided_at" TIMESTAMPTZ(6);

CREATE TABLE "breaks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "barber_id" UUID NOT NULL,
    "weekday" SMALLINT,
    "start_minute" SMALLINT NOT NULL,
    "end_minute" SMALLINT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'approved',
    "requested_by" "RequestActor" NOT NULL DEFAULT 'barber',
    "decided_by_id" UUID,
    "decided_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "breaks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "breaks_weekday_check" CHECK ("weekday" IS NULL OR ("weekday" BETWEEN 0 AND 6)),
    CONSTRAINT "breaks_range_check" CHECK ("start_minute" >= 0 AND "end_minute" <= 1440 AND "start_minute" < "end_minute")
);
CREATE INDEX "breaks_barber_id_idx" ON "breaks" ("barber_id");

ALTER TABLE "breaks" ADD CONSTRAINT "breaks_barber_id_fkey"
    FOREIGN KEY ("barber_id") REFERENCES "barbers" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
