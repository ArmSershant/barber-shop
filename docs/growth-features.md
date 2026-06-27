# Growth Features — Ideas & Priorities

> Status: **ideas only.** A backlog of features to grow a two-sided barber
> marketplace (Yerevan). Ordered by rough **impact ÷ effort**. Many are small
> because the core (booking, reviews, favorites, districts, approval, analytics)
> already exists.
>
> Not financial/business advice — these are product directions to evaluate, not
> guarantees.

## The two growth loops

A marketplace grows on two flywheels; most features below feed one of them:

- **Demand (customers):** find → book → come back → refer.
- **Supply (barbers/shops):** join → get bookings → stay → bring their own clients.

The platform wins when a barber's *own* clients start booking through it (so the
barber can't easily leave) — loyalty points, deposits, and provider tools all push toward that.

---

## Tier 1 — High impact, low/medium effort (do first)

1. **Referral program.** "Invite a friend — you both get X points / ֏ off first
   booking." Cheapest growth channel; reuses the loyalty ledger. Track referrer via
   a code/link.
2. **First-booking discount** for new accounts (platform-funded, capped). Converts
   browsers → first booking, the hardest step.
3. **No-show protection / deposits.** Optional deposit (or full prepay) to hold a
   slot, refundable per policy. Reduces no-shows (a top provider complaint) and
   *requires* payments — natural to ship with it. Big reason barbers stay.
4. **Rebooking / "your usual" recurring appointments.** "Book the same cut with
   Narek every 4 weeks." You already have rebook nudges + "book again"; add a
   standing-appointment option. Drives repeat volume directly.
5. **Web push / better reminders.** Reminder emails exist; add browser push and
   (once SMS is on) texts for upcoming appointments → fewer no-shows, more return visits.
6. **Provider self-promotions.** Let a barber run a time-boxed discount ("−20% Tue–Wed")
   surfaced on discovery. Fills slow slots → barbers see real value → retention.

## Tier 2 — Strong, more effort

7. **Gift cards & service packages.** "Buy 5 cuts, get 1 free" / gift a friend.
   Pre-paid balance locks spend onto the platform (also needs payments). Strong
   retention + upfront cash.
8. **Memberships / subscriptions for customers.** Monthly fee → N cuts or standing
   discount. Predictable demand for barbers, recurring revenue for the platform.
9. **Google Business / Maps presence + 2-way calendar sync.** Let providers sync
   their Google Calendar (we already emit `.ics`; add real sync) so the platform
   becomes their primary calendar — huge stickiness. Plus Google Business listing
   to capture "barber near me" search demand.
10. **Waitlist for full slots.** "Notify me if a slot opens." Captures demand that
    currently bounces when a barber is fully booked.
11. **Maps / "near me" discovery.** You have districts; add geolocation + a map view
    so customers find the closest open chair now. Strong for walk-in-style demand.

## Tier 3 — Monetization & scale levers

12. **Featured / boosted listings (paid).** You already have `isFeatured`; make it a
    paid placement barbers buy — direct revenue, no commission dependency.
13. **Provider subscription tiers.** Free basic + paid tier (more photos, promotions,
    analytics, lower commission). Recurring revenue independent of booking volume.
14. **Provider analytics upgrades.** You have basics; add revenue trends, busiest
    hours, client retention rate, "clients who haven't returned in 60 days" → gives
    barbers a reason to log in daily.
15. **Reviews flywheel.** Auto-request review after completion (exists) + reply-to-
    review for providers + photo reviews → more content → better SEO + trust.

## Trust & quality (table stakes as you scale)

- Verified badges (exists) — extend to ID/phone verification.
- Visible cancellation policies + response-time on profiles.
- Report/flag + moderation (admin tools exist).

## Suggested sequence

1. **Payments** (gates deposits, packages, gift cards, loyalty redemption).
2. **Loyalty earn** + **referrals** + **first-booking discount** (retention/acquisition,
   share one ledger).
3. **Deposits / no-show protection** (provider value).
4. **Recurring appointments** + **waitlist** + **push reminders** (repeat volume).
5. **Boosted listings / subscriptions** (monetization).
6. **Calendar sync + Maps** (deeper stickiness, bigger build).

Almost everything compounds once **payments** and the **points ledger** exist — so
those two are the foundation the rest builds on.

---

_See also: `payments-design.md`, `loyalty-design.md`, `01-product-spec.md` (monetization/roadmap)._
