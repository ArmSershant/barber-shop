// Pure booking-price math (no DB). Auto-discounts (provider promo + first-visit)
// are applied first; loyalty redemption then caps on the discounted price.
// We take the BEST single auto-discount rather than stacking them, so a booking
// can never be discounted twice automatically.

function clampPct(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.max(0, Math.min(100, Math.floor(pct)));
}

/** A provider's promo %, but only inside its active window (0 otherwise). */
export function activePromoPercent(
  promoPercent: number,
  startsAt: Date | null | undefined,
  endsAt: Date | null | undefined,
  nowMs: number,
): number {
  const pct = clampPct(promoPercent);
  if (pct <= 0) return 0;
  if (startsAt && nowMs < startsAt.getTime()) return 0;
  if (endsAt && nowMs > endsAt.getTime()) return 0;
  return pct;
}

/** The single best automatic discount %: active promo vs first-visit (if eligible). */
export function autoDiscountPercent(args: {
  promoPercent: number;
  promoStartsAt?: Date | null;
  promoEndsAt?: Date | null;
  firstVisitPercent: number;
  isFirstVisit: boolean;
  nowMs: number;
}): number {
  const promo = activePromoPercent(args.promoPercent, args.promoStartsAt, args.promoEndsAt, args.nowMs);
  const firstVisit = args.isFirstVisit ? clampPct(args.firstVisitPercent) : 0;
  return Math.max(promo, firstVisit);
}

/** Apply a percentage discount to a price, floored, never below 0. */
export function applyPercentDiscount(baseAmd: number, pct: number): number {
  const p = clampPct(pct);
  if (p <= 0 || baseAmd <= 0) return Math.max(0, baseAmd);
  return Math.max(0, baseAmd - Math.floor((baseAmd * p) / 100));
}
