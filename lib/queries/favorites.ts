import { prisma } from '@/lib/db';
import type { BarberCardData } from '@/lib/queries/barbers';

/** The barbers a user has saved (excludes suspended/deleted), as discovery cards. */
export async function getFavoriteBarbers(userId: string): Promise<BarberCardData[]> {
  const rows = await prisma.favorite.findMany({
    where: { userId, barber: { deletedAt: null, status: { not: 'suspended' } } },
    select: {
      barber: {
        select: {
          id: true,
          slug: true,
          displayName: true,
          photoUrl: true,
          experienceYears: true,
          ratingAvg: true,
          ratingCount: true,
          isVerified: true,
          isFeatured: true,
          shop: { select: { slug: true, name: true } },
          district: { select: { id: true, nameEn: true, nameHy: true, slug: true } },
        },
      },
    },
  });
  return rows.map((r) => ({ ...r.barber, ratingAvg: Number(r.barber.ratingAvg) }));
}
