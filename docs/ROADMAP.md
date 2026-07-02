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

## 3. Known gaps & tech debt 🟡

- **Automated tests / CI** ⬜ — no test suite around booking, availability, or
  loyalty math (the parts most costly to break). Highest reliability priority
  before real traffic.
- **Rate limiting / abuse protection** ⬜ — booking and auth endpoints are open.
- **SMS** 🟡 — fully wired but gated; flip `SMS_ENABLED` + configure a provider.
- **Points expiry** ⬜ — earn/redeem done; a 12-month inactivity lapse cron is
  deferred (design in `loyalty-design.md` §6).
- **Email deliverability** 🟡 — depends on `EMAIL_API_KEY`; verify domain/SPF/DKIM
  before launch so confirmations don't spam-fold.
- **Migration hygiene** — apply `0017_loyalty` + `0018_loyalty_redeem` in prod,
  then `prisma migrate resolve --applied …` + `prisma generate`.

---

## 4. Backlog by phase

Ordered by impact ÷ effort and dependency. Each item notes what it unblocks.

### Phase A — Launch-readiness (do before/at public launch)
1. **Test suite + CI** — unit tests for availability + loyalty math; a couple of
   e2e booking flows; run on PRs. *Unblocks: shipping confidently.*
2. **Rate limiting** on `auth/*` and `barbers/[slug]/bookings`. *Abuse/spam guard.*
3. **Email domain verification** + a real `EMAIL_API_KEY`. *Deliverable confirmations.*
4. **Enable SMS** (optional at launch) — reminders/confirmations cut no-shows.

### Phase B — Retention & growth (no payments needed) ⭐ start here
5. **Referral program** — invite → both earn points on first completed booking.
   Builds directly on the loyalty ledger. *Cheapest growth loop.*
6. **Waitlist / "notify when a slot opens"** — subscribe to a full day, auto-notify
   on cancellation. *Captures dropped demand.*
7. **Rebook nudges** — cron using the existing `rebookNudgeSentAt` field.
8. **Web push notifications** — the `push` channel already exists in the schema.
9. **Provider self-promotions** — time-boxed discount surfaced on discovery.

### Phase C — Discovery & UX polish
10. **Map view + filters** (open-now / price / rating) — `shops.lat/lng` exist.
11. **PWA / installable app** — pairs with web push; phone-first market.
12. **Review replies + photo reviews** — trust + SEO.

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
17. **Points expiry cron** (12-month inactivity).
18. **First-booking discount** for new accounts (platform-funded, capped).

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
