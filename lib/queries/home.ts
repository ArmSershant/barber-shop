import { prisma } from '@/lib/db';

export interface HomeStats {
  barbers: number;
  shops: number;
  districts: number;
}

/**
 * Headline counts for the home hero. Mirrors the public-listing gating used by
 * the discovery queries (no suspended/deleted; responsible account verified).
 */
export async function getHomeStats(): Promise<HomeStats> {
  const [barbers, shops, districts] = await Promise.all([
    prisma.barber.count({
      where: {
        deletedAt: null,
        status: { not: 'suspended' },
        OR: [{ user: { emailVerified: true } }, { shop: { owner: { emailVerified: true } } }],
      },
    }),
    prisma.shop.count({
      where: { deletedAt: null, status: { not: 'suspended' }, owner: { emailVerified: true } },
    }),
    prisma.district.count(),
  ]);

  return { barbers, shops, districts };
}
