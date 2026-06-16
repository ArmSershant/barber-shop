-- Single-use tokens for email verification and password reset.
CREATE TYPE "AuthTokenType" AS ENUM ('email_verify', 'password_reset');

CREATE TABLE "auth_tokens" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "type" "AuthTokenType" NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "used_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_tokens_token_hash_key" ON "auth_tokens" ("token_hash");
CREATE INDEX "auth_tokens_user_id_idx" ON "auth_tokens" ("user_id");

ALTER TABLE "auth_tokens"
  ADD CONSTRAINT "auth_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
