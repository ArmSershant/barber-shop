# Loyalty / Bonus Points — Design Notes

> Status: **design only, not implemented.** Goal: customers earn points for
> bookings and redeem them for discounts/free visits, so they keep booking
> *through the platform* instead of going direct to the barber.
>
> Tightly coupled to **payments** (`payments-design.md`) — redemption is a
> discount on money, so decide the money model first.

## 1. Why this matters

The biggest churn risk for a booking marketplace: a customer discovers a barber
on the platform, then books directly by phone next time (the "elders' way").
Loyalty points create a reason to stay — accrued value is only redeemable here.

## 2. The decisions to make first

1. **Earn rule** — options:
   - Flat points per completed booking (e.g. 10 pts/visit). Simple, predictable.
   - Points per ֏ spent (e.g. 1 pt per 100 ֏). Rewards bigger spenders.
   - **Recommended:** per-֏ spent, only on **completed** bookings (not no-shows/cancellations).
2. **Redemption** — points → AMD discount at a fixed rate (e.g. 100 pts = 500 ֏ off),
   or points → a free standard cut once a threshold is hit. Fixed AMD rate is
   simpler and composes with any service.
3. **Who funds the discount?** ⭐ the critical one:
   - **Platform-funded** — the discount comes out of the platform's 20% commission.
     Barber still gets their full 80% of the *pre-discount* price. Best for adoption
     (barbers love it), but costs the platform.
   - **Barber-funded** — barber absorbs the discount. Hard to enforce; needs opt-in.
   - **Recommended:** platform-funded at launch (it's a marketing cost), capped.
4. **Who earns** — registered users only (guests earn nothing → strong reason to
   register, which we already nudge on the confirmation screen).
5. **Guards** — expiry (e.g. points lapse after 12 months of inactivity), max
   redemption per booking (e.g. up to 50% of price), earn only after completion
   so cancellations can't farm points.

## 3. Data model (sketch)

- `PointsLedger` — append-only: `userId, bookingId?, delta (+earn / −redeem),
  reason (earned|redeemed|expired|adjustment), createdAt`. Balance = sum of deltas
  (cache a `pointsBalance` on `User` for speed, recompute from ledger as source of truth).
- Optional `LoyaltyConfig` (or env): earn rate, redemption rate, caps, expiry —
  so values can change without a deploy.

Append-only ledger (not a single mutable balance) is important for auditability
and to reconcile against payments/refunds.

## 4. Flow

- **Earn:** on booking **complete** (the existing complete endpoint) → write a
  `+earn` ledger row (`floor(pricePaid / earnDivisor)`).
- **Redeem:** at checkout, customer chooses "use points" → server caps it
  (≤ balance, ≤ max % of price) → discount applied to the amount charged → write a
  `−redeem` row. With payments live, the discount reduces the charged total; the
  platform commission absorbs it (platform-funded model).
- **Refund/cancel of a completed booking** → reverse the earn row.
- **Expiry:** a cron (we already run one for reminders) lapses inactive points.

## 5. UI touchpoints

- **Account page** — points balance + simple history (reuse the ledger).
- **Booking widget** — "You have N points — apply M ֏ off?" toggle at checkout.
- **Confirmation screen** — "You earned N points" after a completed visit.
- **Registration nudge** — already added; can mention "earn rewards".

## 6. Phasing

1. Decide earn rule + funding model (gated on payments model).
2. `PointsLedger` + balance cache + config.
3. Earn on completion (no redemption yet) — start accruing so there's a balance
   before redemption launches.
4. Redemption at checkout (needs payments live to discount real money).
5. Expiry cron + account history UI.

---

_See also: `payments-design.md`, `growth-features.md`, `01-product-spec.md`._
