import { prisma } from '@/lib/db';

export interface BarberCardData {
  id: string;
  slug: string;
  displayName: string;
  photoUrl: string | null;
  experienceYears: number | null;
  ratingAvg: number;
  ratingCount: number;
  shop: { slug: string; name: string } | null;
  district: { nameEn: string; nameHy: string; slug: string } | null;
}

/** Public list of barbers for discovery. Hides suspended/deleted. */
export async function listBarbers(params: { q?: string } = {}): Promise<BarberCardData[]> {
  const q = params.q?.trim();
  const barbers = await prisma.barber.findMany({
    where: {
      deletedAt: null,
      status: { not: 'suspended' },
      ...(q ? { displayName: { contains: q, mode: 'insensitive' } } : {}),
    },
    orderBy: [{ ratingAvg: 'desc' }, { createdAt: 'desc' }],
    take: 60,
    select: {
      id: true,
      slug: true,
      displayName: true,
      photoUrl: true,
      experienceYears: true,
      ratingAvg: true,
      ratingCount: true,
      shop: { select: { slug: true, name: true } },
      district: { select: { nameEn: true, nameHy: true, slug: true } },
    },
  });
  return barbers.map((b) => ({ ...b, ratingAvg: Number(b.ratingAvg) }));
}

/** Full public profile for a barber, or null if not found/deleted. */
export async function getBarberProfile(slug: string) {
  const barber = await prisma.barber.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      displayName: true,
      bio: true,
      photoUrl: true,
      experienceYears: true,
      ratingAvg: true,
      ratingCount: true,
      deletedAt: true,
      shop: { select: { slug: true, name: true } },
      district: { select: { nameEn: true, nameHy: true, slug: true } },
      ownedServices: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, description: true, durationMin: true, priceAmd: true },
      },
      workingHours: {
        orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }],
        select: { weekday: true, startMinute: true, endMinute: true },
      },
      portfolioImages: { orderBy: { sortOrder: 'asc' }, select: { id: true, url: true } },
    },
  });
  if (!barber || barber.deletedAt) return null;
  return { ...barber, ratingAvg: Number(barber.ratingAvg) };
}

export type BarberProfile = NonNullable<Awaited<ReturnType<typeof getBarberProfile>>>;
