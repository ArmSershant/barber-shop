# Barber-Shop.am — Roadmap & Project Status

> The single "where are we / where next" document. Design specifics live in
> `HANDOFF.md`; product/UX/growth thinking in `design-and-growth-suggestions.md`
> and `growth-features.md`; money and points design in `payments-design.md` and
> `loyalty-design.md`. This file ties them together and recommends sequencing.
>
> Last updated: 2026-07. Status legend: ✅ shipped · 🟡 partial · ⬜ not started.

---

## 1. What this is

A live, trilingual (hy default, en, ru) **two-sided barber booking marketplace**
for Yerevan — barbershops and independent barbers list their profiles; customers
(registered or guest) discover and book online. Next.js App Router + TypeScript +
Mantine + RTK Query + Prisma + Neon Postgres, deployed on Vercel.

Two flywheels drive everything (see `growth-features.md`):
- **Demand:** find → book → come back → refer.
- **Supply:** join → get bookings → stay → bring their own clients.

The strategic goal: make a barber's *own* clients book *through the platform*, so
the provider can't easily churn off it. Loyalty, deposits, and provider tools all
push toward that.

---

## 2. Current state — what's built ✅

Grounded in the live API surface (`app/api/**`) and migrations `0001`–`0018`.

**Accounts & auth** ✅
Email/password auth with rotating refresh tokens, email verification, password
reset (`auth/*`), role model (customer / barber / shop_owner / admin), account
page with avatar (crop-on-upload), phone (country-code picker), home district.

**Discovery** ✅
Barber and shop listings with district filter, search, sort, "nearby first" by
saved district; home page with top-rated + counts; profile pages with portfolio
lightbox, services, working hours, reviews; SEO (JSON-LD, sitemap).

**Booking** ✅
Slot availability engine (working hours, breaks, time-off, buffers, no
double-booking via GiST constraint); guest + logged-in booking; per-provider
**approval flow** (auto-confirm vs request → accept/reject); cancel; complete;
no-show; add-to-calendar (.ics); email confirmations; SMS (gated, off until a
provider is configured).

**Provider tools** ✅
Dashboard with bookings (polling + refetch-on-focus), analytics, service catalog,
working hours / breaks / time-off, shop defaults + apply-to-roster, shop photo
gallery, barber roster management, onboarding.

**Reviews & engagement** ✅
Post-visit reviews (gated to completed bookings), ratings roll-up, favorites,
in-app notifications (booking created/confirmed/cancelled, review request/received)
+ email; monthly **newsletter** opt-in (per-language, segmented) via Resend.

**Loyalty** ✅ (earn + redeem; **per-provider**)
Providers opt in and set: points per 100 ֏ (earn), ֏-per-point (redeem value),
and max % of a booking points can cover. Append-only `PointsLedger` scoped to a
shop or independent barber; balance summed from the ledger. Earn on completion
(idempotent), redeem at checkout as a pay-in-person discount, refund on
cancel/reject. Account page shows per-provider balances + history; checkout earn
hint; per-booking "earned" badge. **Redemption works without online payments.**

**Admin** ✅
Overview, provider verify/feature/suspend, **test flag** (hide internal accounts
from the public; admins still see them), permanent account delete, review
moderation, inline **edit-URL** for any provider.

**Platform niceties** ✅
Editable page URLs (slugs) with uniqueness + reserved-word checks; **Armenian &
Russian → Latin transliteration** for auto-generated slugs; heritage light/dark
theme; animated favicon-style pole logo; `unstable_cache` on the home query.

---

## 3. Known gaps & tech debt

- **Automated tests / CI** ✅ — Vitest suite over the pure logic (slots, loyalty
  math, slugs); CI runs lint → typecheck → test → build. See `launch-setup.md` §1.
  (Broader e2e/DB-integration tests are still a future add.)
- **Rate limiting / abuse protection** ✅ — Postgres-backed per-IP limiter on
  login/register/forgot-password/booking (fails open, gated). See `launch-setup.md` §2.
- **Email deliverability** 🟡 — code ready; **verify the Resend domain + DNS**
  (SPF/DKIM/DMARC) and set `EMAIL_FROM`/`EMAIL_API_KEY` before launch. `launch-setup.md` §3.
- **SMS** 🟡 — fully wired but gated; flip `SMS_ENABLED` + configure a provider.
- **Points expiry** ⬜ — earn/redeem done; a 12-month inactivity lapse cron is
  deferred (design in `loyalty-design.md` §6).
- **Migration hygiene** — apply migrations through `0023_review_photo` in prod
  (`pnpm prisma migrate deploy` + `prisma generate`).

---

## 4. Backlog by phase

Ordered by impact ÷ effort and dependency. Each item notes what it unblocks.

### Phase A — Launch-readiness (do before/at public launch)
1. **Test suite + CI** ✅ — unit tests for slots + loyalty math + slugs, wired into
   CI. (Follow-up: e2e/DB-integration booking tests.)
2. **Rate limiting** ✅ — Postgres limiter on `auth/*` + `barbers/[slug]/bookings`.
3. **Email domain verification** 🟡 — verify Resend domain + set `EMAIL_FROM`/
   `EMAIL_API_KEY` (ops step; see `launch-setup.md` §3).
4. **Enable SMS** ⬜ (optional at launch) — reminders/confirmations cut no-shows.

### Phase B — Retention & growth (no payments needed)
5. **Referral program** ⬜ 🚧 *blocked — needs a decision.* Since loyalty is now
   **per-provider**, a referral reward has no obvious scope to land in (which
   provider funds/holds the points?). Options: a platform-wide credit concept, or
   fund it as a first-booking discount (Phase E #18). Decide the model first.
6. **Waitlist / "notify when a slot opens"** ✅ — customers join a full day
   (per-provider `waitlistEnabled`); auto-notified (in-app + email) on cancellation.
7. **Rebook nudges** ✅ — already live in `cron/reminders` (`rebookNudgeSentAt`).
8. **Web push notifications** ⬜ 🚧 *needs VAPID keys (your setup, like SMS).* The
   `push` channel exists; code can be gated/no-op until keys are set.
9. **Provider self-promotions** ✅ — owner-set time-boxed promo % (with a date
   window), surfaced as a "−N%" badge on discovery + applied at booking.

### Phase C — Discovery & UX polish
10. **Discovery filters** ✅ (min rating, price sort, open-now) / **Map view** ⬜ 🚧
    *still needs a maps-provider choice* (Leaflet+OSM free, or keyed).
11. **PWA / installable app** ✅ — manifest + icons + theme-color shipped.
12. **Review replies** ✅ / **photo reviews** ✅ — providers reply to reviews;
    customers can attach a photo. Both shown on the profile.

### Phase D — Monetization
13. **Provider subscriptions** — `SubscriptionStatus` enum already exists; paid
    tiers (featured placement, more photos, analytics) — revenue *without*
    customer-card payments. *Fastest path to revenue.*
14. **Paid featured listings** — reuse `isFeatured` as a purchasable boost.
15. **Payments + 20% commission** (`payments-design.md`) — the big one; gated on
    Model A/B + bank decision. *Unblocks:* deposits/no-show protection, prepay,
    and loyalty→money nuances.
16. **No-show deposits / prepay** — requires #15.

### Phase E — Loyalty completion
17. **Points expiry cron** ✅ — 12-month inactivity lapse runs in the daily cron.
18. **First-visit discount** ✅ — implemented per-provider (owner-set %), applied to
    a customer's first booking with that provider (best-of vs. active promo).

---

## 5. Where to start — recommendation

Two sensible tracks depending on your priority:

- **If launch is near → Phase A first.** A minimal **test suite + CI** around
  booking/availability/loyalty plus **rate limiting** and **email verification** is
  the responsible next step. It's unglamorous but it's what protects everything
  already built once real users arrive.

- **If you want visible momentum without payments → Phase B, starting with the
  Referral program.** It compounds the loyalty work you just shipped, it's the
  cheapest customer-acquisition loop, and it needs no bank/payment decisions. A
  waitlist is a strong second.

**Suggested concrete sequence:** Referral program → Waitlist → then a lightweight
test suite/CI → then decide payments vs. provider subscriptions for revenue.

Payments is the only truly *blocked* item (needs your Model A/B + bank choice);
everything else in Phases A–C can proceed now.

---

## 6. Doc index

| Doc | Purpose |
| --- | --- |
| `ROADMAP.md` | This file — status + backlog + sequencing. |
| `launch-setup.md` | Phase A ops: tests/CI, rate limiting, email/SMS env. |
| `00-naming.md` | Naming conventions. |
| `01-product-spec.md` | Product spec. |
| `02-data-model.md` | Data model rationale. |
| `03-architecture-and-api.md` | Architecture + API design. |
| `HANDOFF.md` | Heritage redesign spec (design tokens, per-screen). |
| `design-and-growth-suggestions.md` | Design/UX/growth playbook. |
| `growth-features.md` | Growth backlog (impact ÷ effort). |
| `loyalty-design.md` | Loyalty design (earn/redeem/expiry). |
| `payments-design.md` | Payments + commission design (pending decision). |
| `*.pdf` / `*.dc.html` | Pixel-reference designs per screen. |
