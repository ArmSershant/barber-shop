import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * Points earned for spending `amountAmd` at a provider offering `pointsPer100`
 * points per 100 ֏. Floored. e.g. 2,000 ֏ at 1 pt/100 = 20 pts.
 */
export function pointsForAmount(amountAmd: number, pointsPer100: number): number {
  if (amountAmd <= 0 || pointsPer100 <= 0) return 0;
  return Math.floor((amountAmd * pointsPer100) / 100);
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
