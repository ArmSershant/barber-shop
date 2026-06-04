import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';

// The current user's bookings (last 90 days + future), newest first.
export async function GET() {
  try {
    const { userId } = await requireAuth();

    const bookings = await prisma.booking.findMany({
      where: {
        customerUserId: userId,
        startsAt: { gte: new Date(Date.now() - 90 * 86_400_000) },
      },
      orderBy: { startsAt: 'desc' },
      take: 100,
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
        totalPriceAmd: true,
        services: { select: { typeSnapshot: true, nameSnapshot: true } },
        barber: { select: { displayName: true, slug: true } },
      },
    });

    return ok({
      bookings: bookings.map((b) => ({
        id: b.id,
        startsAt: b.startsAt,
        endsAt: b.endsAt,
        status: b.status,
        totalPriceAmd: b.totalPriceAmd,
        services: b.services.map((s) => ({ type: s.typeSnapshot, name: s.nameSnapshot })),
        barber: b.barber,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
