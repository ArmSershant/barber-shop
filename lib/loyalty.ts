import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { pointsForAmount, cappedRedeemPoints } from '@/lib/loyalty-math';

// Pure arithmetic lives in loyalty-math.ts (unit-tested, DB-free); re-exported
// here so existing callers can keep importing from '@/lib/loyalty'.
export { pointsForAmount, cappedRedeemPoints };

/** A loyalty scope is exactly one of a shop or an independent barber. */
export type LoyaltyScope = { scopeShopId: string } | { scopeBarberId: string };

/** Current point balance for a customer at one provider scope (from the ledger). */
export async function pointsBalanceForScope(userId: string, scope: LoyaltyScope): Promise<number> {
  const agg = await prisma.pointsLedger.aggregate({
    where: { userId, ...scope },
    _sum: { delta: true },
  });
  return agg._sum.delta ?? 0;
}

/**
 * Refund points that were redeemed on a booking (e.g. it was cancelled/rejected).
 * Writes one compensating 'adjustment' row; idempotent via the unique
 * (bookingId, reason) index, so repeated cancels don't double-refund.
 */
export async function refundRedemptionForBooking(bookingId: string): Promise<number> {
  const redeem = await prisma.pointsLedger.findFirst({
    where: { bookingId, reason: 'redeemed' },
    select: { userId: true, delta: true, scopeShopId: true, scopeBarberId: true },
  });
  if (!redeem || redeem.delta >= 0) return 0;

  const scope: LoyaltyScope = redeem.scopeShopId
    ? { scopeShopId: redeem.scopeShopId }
    : { scopeBarberId: redeem.scopeBarberId! };
  const refund = -redeem.delta; // positive
  try {
    await prisma.pointsLedger.create({
      data: { userId: redeem.userId, bookingId, delta: refund, reason: 'adjustment', ...scope },
    });
    return refund;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return 0;
    throw err;
  }
}

/**
 * Accrue loyalty points for a completed booking into the provider's program:
 * the shop (shop bookings, pooled across its barbers) or the independent barber.
 * Only if that provider has loyalty enabled. Guests (no customerUserId) earn
 * nothing. Idempotent via the unique (bookingId, reason='earned') row, so
 * retries are safe. Best-effort — callers must not let this block completion.
 *
 * Returns points earned, or 0.
 */
export async function earnPointsForBooking(bookingId: string): Promise<number> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      customerUserId: true,
      totalPriceAmd: true,
      status: true,
      shopId: true,
      barberId: true,
      shop: { select: { loyaltyEnabled: true, loyaltyPointsPer100: true } },
      barber: { select: { loyaltyEnabled: true, loyaltyPointsPer100: true } },
    },
  });
  if (!booking || booking.status !== 'completed' || !booking.customerUserId) return 0;

  // Provider scope: shop for shop bookings, else the independent barber.
  const usingShop = Boolean(booking.shopId && booking.shop);
  const config = usingShop ? booking.shop! : booking.barber;
  if (!config?.loyaltyEnabled) return 0;

  const points = pointsForAmount(booking.totalPriceAmd, config.loyaltyPointsPer100);
  if (points <= 0) return 0;

  const userId = booking.customerUserId;
  const scope = usingShop
    ? { scopeShopId: booking.shopId }
    : { scopeBarberId: booking.barberId };

  try {
    await prisma.pointsLedger.create({
      data: { userId, bookingId, delta: points, reason: 'earned', ...scope },
    });
    return points;
  } catch (err) {
    // Already accrued for this booking — not an error.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return 0;
    throw err;
  }
}
