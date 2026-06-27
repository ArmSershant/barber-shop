# Payments & Commission — Design Notes

> Status: **design only, not implemented.** This documents the plan for taking
> online payments (VISA/Mastercard, Idram) with a 20% platform commission and
> 80% to the provider. Verify all provider/legal specifics before building.
>
> ⚠️ Not legal or financial advice. The settlement model (who holds the money)
> has regulatory/AML implications in Armenia — confirm with the acquiring bank
> and a lawyer before writing code.

## 1. The real problem: the split, not the charge

Charging a card or an Idram wallet is the easy part. The 20/80 **split** is what
makes this a marketplace, and that's where Armenia differs from US/EU.

Local options (verify current capabilities directly):

- **Cards (VISA/Mastercard):** ArCa (national processor) via a bank gateway —
  Ameriabank, Inecobank, Converse, Acba, etc. Typically a hosted payment page +
  callback/webhook.
- **Idram / IdramPay:** popular local e-wallet + card acquiring.
- **Others:** Telcell, EasyPay.

These gateways generally **do not** offer Stripe-Connect-style automatic
split-to-sub-merchant. You cannot have the gateway route 80% to the barber and
20% to the platform in one transaction. That forces a choice between two models.

## 2. Settlement models — pick one first

### Model A — Collect & settle (what we discussed)
All money lands in the **platform** merchant account. We record each booking's
20/80 split, then **pay out 80%** to barbers separately (bank transfer / Idram)
on a schedule (e.g. weekly).

- ➕ Full control, clean UX (customer pays once on our site).
- ➖ We hold other people's money → likely **payment-aggregator / AML
  obligations** + a specific contract with the acquiring bank. Must be confirmed
  legally before launch.

### Model B — Commission billing (simpler legally)
The customer pays the **barber directly** (their own terminal / Idram merchant);
the platform **bills the barber 20%** afterwards, or charges a flat monthly
subscription. We never touch client funds → no aggregator licensing.

- ➕ Much simpler legally; fastest to launch.
- ➖ Weaker control; commission collection must be enforced.

**Recommendation:** decide A vs B before any code — the schema and flow differ.
Many small marketplaces in markets without split-payments start with **A + manual
batch payouts**, or sidestep with **B**.

## 3. Architecture (Model A)

Provider-agnostic payments layer, mirroring `lib/sms.ts`, so we can start with one
gateway and add others later (`lib/payments/`).

**Flow** (fits the existing approval flow):

1. Customer books → booking is `requested` or `confirmed`.
2. "Pay now" → server creates a `Payment` row (`pending`) → redirect to the
   gateway hosted page / Idram URL with an order id.
3. Gateway redirects back **and** calls our **webhook** (`/api/payments/webhook`).
   Trust the webhook, not the browser redirect.
4. Webhook verifies the signature → marks `Payment` `paid` → computes
   `commission = round(amount * 0.20)`, `payout = amount − commission` → confirms
   the booking → writes a ledger entry.
5. **Payouts:** admin (or cron) settles each provider's accumulated balance and
   marks it `paid`.
6. **Cancellation/refund:** refund via gateway API, reverse the ledger entry.

### Data model (new tables)
- `Payment` — `bookingId, provider, providerRef, amountAmd, status
  (pending|paid|failed|refunded), commissionAmd, payoutAmd, paidAt`.
- `PayoutAccount` — per shop/barber: bank account or Idram id (where the 80% goes).
- `Payout` — `providerId, periodStart, periodEnd, grossAmd, commissionAmd,
  netAmd, status, paidAt` (the "we owe this provider X" ledger).

### Engineering rules
- **Integer AMD only** (we already store `priceAmd` as ints — no floats).
- **Idempotent webhook** — gateways retry; dedupe on `providerRef`.
- **Verify webhook signatures**; never confirm a payment from the redirect alone.
- **Reconciliation view** in the admin panel (payments vs payouts).
- **Commission rate** in config/env, not hard-coded, so it can change.

## 4. Open product decisions

1. **Model A (we collect & pay out) or Model B (barber collects, we bill commission)?**
2. **Prepay required to book, or optional / pay-at-shop?** (Determines whether
   payment blocks the booking.)
3. Payout cadence (instant vs weekly vs monthly) and minimum payout threshold.
4. Refund policy on customer/provider cancellation.

## 5. Suggested phasing

1. **Legal/bank conversation** — A vs B (gates everything).
2. Schema + `lib/payments` abstraction + migration.
3. One gateway end-to-end in test mode (create → hosted page → webhook → confirm).
4. Commission split + ledger on successful payment.
5. Payout tracking (admin) + refunds on cancel.
6. Add a second provider (cards + Idram).

---

_See also: `01-product-spec.md` (monetization / roadmap), `HANDOFF.md` (design)._
