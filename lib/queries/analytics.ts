import { prisma } from '@/lib/db';
import { HttpError } from '@/lib/http';

export interface ProviderAnalytics {
  totals: { all: number; upcoming: number; completed: number; cancelled: number; noShow: number };
  revenueAmd: number; // sum of completed bookings
  last30: { bookings: number; revenueAmd: number };
  completionRate: number; // completed / (completed + noShow + cancelled), 0..1
  noShowRate: number; // noShow / (completed + noShow), 0..1
  repeatCustomers: number; // customers with >1 completed booking
  byWeekday: number[]; // 7 entries, Mon..Sun — count of all bookings
}

/** Aggregate booking stats for the current provider (own barber, or whole shop). */
export async function getProviderAnalytics(userId: string): Promise<ProviderAnalytics> {
  const [shop, ownBarber] = await Promise.all([
    prisma.shop.findFirst({ where: { ownerUserId: userId, deletedAt: null }, select: { id: true } }),
    prisma.barber.findUnique({ where: { userId }, select: { id: true } }),
  ]);
  if (!shop && !ownBarber) {
    throw new HttpError(403, 'NO_PROVIDER_PROFILE', 'Create a shop or barber profile first.');
  }
  const scope = shop ? { shopId: shop.id } : { barberId: ownBarber!.id };

  const now = new Date();
  const in2hAgo = new Date(now.getTime() - 2 * 3600_000);
  const days30Ago = new Date(now.getTime() - 30 * 24 * 3600_000);

  const bookings = await prisma.booking.findMany({
    where: scope,
    select: {
      status: true,
      startsAt: true,
      totalPriceAmd: true,
      customerUserId: true,
      guestPhone: true,
    },
  });

  const totals = { all: bookings.length, upcoming: 0, completed: 0, cancelled: 0, noShow: 0 };
  let revenueAmd = 0;
  let last30Bookings = 0;
  let last30Revenue = 0;
  const byWeekday = [0, 0, 0, 0, 0, 0, 0];
  const completedByCustomer = new Map<string, number>();

  for (const b of bookings) {
    const weekday = (b.startsAt.getDay() + 6) % 7; // 0=Mon
    byWeekday[weekday] += 1;

    if (b.startsAt >= days30Ago) last30Bookings += 1;

    if (b.status === 'completed') {
      totals.completed += 1;
      revenueAmd += b.totalPriceAmd;
      if (b.startsAt >= days30Ago) last30Revenue += b.totalPriceAmd;
      const key = b.customerUserId ?? (b.guestPhone ? `g:${b.guestPhone}` : null);
      if (key) completedByCustomer.set(key, (completedByCustomer.get(key) ?? 0) + 1);
    } else if (b.status === 'cancelled') {
      totals.cancelled += 1;
    } else if (b.status === 'no_show') {
      totals.noShow += 1;
    } else if ((b.status === 'confirmed' || b.status === 'requested') && b.startsAt >= in2hAgo) {
      totals.upcoming += 1;
    }
  }

  const decided = totals.completed + totals.noShow + totals.cancelled;
  const attended = totals.completed + totals.noShow;
  const repeatCustomers = [...completedByCustomer.values()].filter((n) => n > 1).length;

  return {
    totals,
    revenueAmd,
    last30: { bookings: last30Bookings, revenueAmd: last30Revenue },
    completionRate: decided ? totals.completed / decided : 0,
    noShowRate: attended ? totals.noShow / attended : 0,
    repeatCustomers,
    byWeekday,
  };
}
