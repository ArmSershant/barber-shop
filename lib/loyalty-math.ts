// Pure loyalty arithmetic (no DB) so it's easy to unit test. The DB-backed
// earn/redeem/refund logic lives in lib/loyalty.ts and re-exports these.

/**
 * Points earned for spending `amountAmd` at a provider offering `pointsPer100`
 * points per 100 ֏. Floored. e.g. 2,000 ֏ at 1 pt/100 = 20 pts.
 */
export function pointsForAmount(amountAmd: number, pointsPer100: number): number {
  if (amountAmd <= 0 || pointsPer100 <= 0) return 0;
  return Math.floor((amountAmd * pointsPer100) / 100);
}

/**
 * How many points can actually be redeemed on a booking, capped by: the points
 * the customer asked to spend, their balance at this provider, and the max % of
 * the price the provider allows points to cover.
 */
export function cappedRedeemPoints(args: {
  requested: number;
  balance: number;
  priceAmd: number;
  amdPerPoint: number;
  maxRedeemPct: number;
}): number {
  const { requested, balance, priceAmd, amdPerPoint, maxRedeemPct } = args;
  if (requested <= 0 || balance <= 0 || amdPerPoint <= 0 || maxRedeemPct <= 0) return 0;
  const maxDiscount = Math.floor((priceAmd * maxRedeemPct) / 100);
  const maxPointsByDiscount = Math.floor(maxDiscount / amdPerPoint);
  return Math.max(0, Math.min(requested, balance, maxPointsByDiscount));
}
