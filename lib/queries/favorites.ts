import { prisma } from '@/lib/db';
import { barberCardSelect, mapBarberCard, type BarberCardData } from '@/lib/queries/barbers';

/** The barbers a user has saved (excludes suspended/deleted), as discovery cards. */
export async function getFavoriteBarbers(userId: string): Promise<BarberCardData[]> {
  const rows = await prisma.favorite.findMany({
    where: { userId, barber: { deletedAt: null, status: { not: 'suspended' } } },
    select: { barber: { select: barberCardSelect } },
  });
  return rows.map((r) => mapBarberCard(r.barber));
}
