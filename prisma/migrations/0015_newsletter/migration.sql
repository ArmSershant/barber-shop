-- Newsletter opt-in + preferred newsletter language (per registered user).
ALTER TABLE "users" ADD COLUMN "newsletter_opt_in" boolean NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "newsletter_lang" text;
