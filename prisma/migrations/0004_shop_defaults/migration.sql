-- Shop-level default working hours + breaks (copy-on-apply templates).

ALTER TABLE "shops"
    ADD COLUMN "default_working_hours" JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN "default_breaks" JSONB NOT NULL DEFAULT '[]';
