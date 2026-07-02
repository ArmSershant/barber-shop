# Launch Setup — Phase A (reliability)

Operational steps that pair with the Phase A code (tests, rate limiting) — see
`ROADMAP.md` §4. Nothing here blocks development; do it before real traffic.

## 1. Tests & CI

- Run locally: `pnpm test` (Vitest, `tests/**/*.test.ts`).
- Covers the pure, breakage-prone logic: slot availability (`lib/slots.ts`),
  loyalty math (`lib/loyalty-math.ts`), and slug/transliteration (`lib/slug.ts`).
- CI (`.github/workflows/ci.yml`) runs lint → typecheck → **test** → build on every
  push/PR to `main`.
- **After pulling these changes, run `pnpm install`** once (adds Vitest) and commit
  the updated `pnpm-lock.yaml`, or CI's `--frozen-lockfile` install will fail.

## 2. Rate limiting

- Backed by the Neon DB (no extra service). Apply migration **0019_rate_limits**,
  then `prisma migrate resolve --applied 0019_rate_limits` + `prisma generate`.
- Enforced per-IP on: login (10/min), register (5/min), forgot-password (5/5min),
  create-booking (15/min). Tune in each route via `enforceRateLimit(...)`.
- Fails **open** (a limiter error never blocks a real request). Disable entirely
  with `RATE_LIMIT_DISABLED=true` (e.g. for load tests).
- The `rate_limits` table grows one row per active `bucket:ip`; rows are reused and
  self-reset each window. Optional housekeeping later: a periodic
  `DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`.

## 3. Email deliverability (Resend)

Transactional email (`lib/email.ts`) no-ops until `EMAIL_API_KEY` is set, and by
default sends from `onboarding@resend.dev`, which will spam-fold. Before launch:

1. In the Resend dashboard, **add and verify your domain** (`barber-shop.am`).
2. Add the DNS records Resend shows — **SPF**, **DKIM**, and a **DMARC** record —
   at your DNS host, and wait for them to verify.
3. Set env vars in Vercel (Production):
   - `EMAIL_API_KEY` — your Resend API key.
   - `EMAIL_FROM` — e.g. `Barber-Shop <no-reply@barber-shop.am>` (must be on the
     verified domain).
4. Send a test booking/confirmation to a real inbox and confirm it lands (not spam).

## 4. SMS (optional, still gated)

Off until `SMS_ENABLED=true` plus `SMS_API_URL` / `SMS_API_KEY` (+ optional
`SMS_SENDER`) are set and the payload in `lib/sms.ts` matches your gateway.

## 5. Env var summary (Production)

| Var | Purpose | Required |
| --- | --- | --- |
| `DATABASE_URL` / `DIRECT_URL` | Neon Postgres | ✅ |
| `NEXT_PUBLIC_APP_URL` | absolute links in emails/JSON-LD | ✅ |
| `EMAIL_API_KEY` / `EMAIL_FROM` | Resend transactional email | before launch |
| `NEWSLETTER_SEGMENTS` | Resend broadcast segments | for newsletter |
| `RATE_LIMIT_DISABLED` | turn limiter off | optional |
| `SMS_ENABLED` / `SMS_API_URL` / `SMS_API_KEY` / `SMS_SENDER` | SMS | when enabling SMS |
| `LOYALTY_*` | none — loyalty is per-provider data now | n/a |
