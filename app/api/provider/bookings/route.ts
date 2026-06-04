import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireRole } from '@/lib/auth/rbac';

// Upcoming bookings for the current provider: their own barber profile, or
// (for shop owners) every barber in their shop.
export async function GET() {
  try {
    const { userId } = await requireRole('barber', 'shop_owner', 'admin');

    const [shop, ownBarber] = await Promise.all([
      prisma.shop.findFirst({ where: { ownerUserId: userId, deletedAt: null }, select: { id: true } }),
      prisma.barber.findUnique({ where: { userId }, select: { id: true } }),
    ]);
    if (!shop && !ownBarber) {
      throw new HttpError(403, 'NO_PROVIDER_PROFILE', 'Create a shop or barber profile first.');
    }

    const bookings = await prisma.booking.findMany({
      where: {
        ...(shop ? { shopId: shop.id } : { barberId: ownBarber!.id }),
        startsAt: { gte: new Date(Date.now() - 2 * 3600_000) },
        status: { in: ['requested', 'confirmed'] },
      },
      orderBy: { startsAt: 'asc' },
      take: 100,
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
        totalPriceAmd: true,
        totalDurationMin: true,
        customerNote: true,
        guestName: true,
        guestPhone: true,
        customer: { select: { fullName: true, phone: true } },
        barber: { select: { displayName: true } },
        services: { select: { nameSnapshot: true } },
      },
    });

    return ok({
      bookings: bookings.map((b) => ({
        id: b.id,
        startsAt: b.startsAt,
        endsAt: b.endsAt,
        status: b.status,
        totalPriceAmd: b.totalPriceAmd,
        totalDurationMin: b.totalDurationMin,
        note: b.customerNote,
        customerName: b.customer?.fullName ?? b.guestName ?? '',
        phone: b.customer?.phone ?? b.guestPhone ?? null,
        barberName: b.barber.displayName,
        services: b.services.map((s) => s.nameSnapshot),
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
