import { cache } from 'react';
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
  district: { id: number; nameEn: string; nameHy: string; slug: string } | null;
}

/** Public list of barbers for discovery. Hides suspended/deleted. */
export async function listBarbers(
  params: { q?: string; district?: string; preferredDistrictId?: number } = {},
): Promise<BarberCardData[]> {
  const q = params.q?.trim();
  const district = params.district?.trim();
  const barbers = await prisma.barber.findMany({
    where: {
      deletedAt: null,
      status: { not: 'suspended' },
      ...(q ? { displayName: { contains: q, mode: 'insensitive' } } : {}),
      ...(district ? { district: { slug: district } } : {}),
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
      district: { select: { id: true, nameEn: true, nameHy: true, slug: true } },
    },
  });
  const mapped = barbers.map((b) => ({ ...b, ratingAvg: Number(b.ratingAvg) }));

  // Customer's home district first (stable sort keeps rating order within).
  const pref = params.preferredDistrictId;
  if (pref && !district) {
    mapped.sort((a, b) => Number(b.district?.id === pref) - Number(a.district?.id === pref));
  }
  return mapped;
}

/** Full public profile for a barber, or null if not found/deleted. */
// Wrapped in React cache so generateMetadata + the page share one query per request.
export const getBarberProfile = cache(async (slug: string) => {
  const barber = await prisma.barber.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      userId: true, // for "is this my own profile" checks — strip before public API output
      displayName: true,
      bio: true,
      photoUrl: true,
      coverUrl: true,
      experienceYears: true,
      districtId: true,
      ratingAvg: true,
      ratingCount: true,
      deletedAt: true,
      shop: { select: { slug: true, name: true, ownerUserId: true } },
      district: { select: { nameEn: true, nameHy: true, slug: true } },
      ownedServices: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
        select: { id: true, type: true, name: true, description: true, durationMin: true, priceAmd: true },
      },
      // Shop barbers offer the services assigned to them from the shop catalog.
      barberServices: {
        where: { service: { isActive: true } },
        select: {
          priceAmdOverride: true,
          durationMinOverride: true,
          service: {
            select: { id: true, type: true, name: true, description: true, durationMin: true, priceAmd: true },
          },
        },
      },
      workingHours: {
        orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }],
        select: { weekday: true, startMinute: true, endMinute: true },
      },
      portfolioImages: { orderBy: { sortOrder: 'asc' }, select: { id: true, url: true } },
      reviews: {
        where: { isHidden: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          customer: { select: { fullName: true } },
        },
      },
    },
  });
  if (!barber || barber.deletedAt) return null;

  // Bookable services: assigned ones for shop barbers (with per-barber price
  // and duration overrides applied), own catalog otherwise.
  const services = barber.shop
    ? barber.barberServices.map((bs) => ({
        ...bs.service,
        priceAmd: bs.priceAmdOverride ?? bs.service.priceAmd,
        durationMin: bs.durationMinOverride ?? bs.service.durationMin,
      }))
    : barber.ownedServices;
  const { barberServices: _bs, ownedServices: _os, ...rest } = barber;

  return { ...rest, services, ratingAvg: Number(barber.ratingAvg) };
});

export type BarberProfile = NonNullable<Awaited<ReturnType<typeof getBarberProfile>>>;
