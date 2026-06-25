import { cache } from 'react';
import { prisma } from '@/lib/db';

export interface ShopCardData {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  address: string | null;
  isVerified: boolean;
  isFeatured: boolean;
  district: { id: number; nameEn: string; nameHy: string; slug: string } | null;
  barberCount: number;
  ratingAvg: number;
  ratingCount: number;
}

/** Public list of shops for discovery. Hides suspended/deleted. */
export async function listShops(
  params: { q?: string; district?: string; preferredDistrictId?: number } = {},
): Promise<ShopCardData[]> {
  const q = params.q?.trim();
  const district = params.district?.trim();
  const shops = await prisma.shop.findMany({
    where: {
      deletedAt: null,
      status: { not: 'suspended' },
      // Only list shops whose owner has verified their email.
      owner: { emailVerified: true },
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
      ...(district ? { district: { slug: district } } : {}),
    },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    take: 60,
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      coverUrl: true,
      address: true,
      isVerified: true,
      isFeatured: true,
      district: { select: { id: true, nameEn: true, nameHy: true, slug: true } },
      _count: { select: { barbers: { where: { deletedAt: null } } } },
      // Shop rating is derived from its barbers' aggregate review scores.
      barbers: {
        where: { deletedAt: null },
        select: { ratingAvg: true, ratingCount: true },
      },
    },
  });
  const mapped = shops.map((s) => {
    // Weighted average across the shop's rated barbers (by review count).
    const rated = s.barbers.filter((b) => b.ratingCount > 0);
    const ratingCount = rated.reduce((sum, b) => sum + b.ratingCount, 0);
    const ratingAvg =
      ratingCount > 0
        ? rated.reduce((sum, b) => sum + Number(b.ratingAvg) * b.ratingCount, 0) / ratingCount
        : 0;

    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      logoUrl: s.logoUrl,
      coverUrl: s.coverUrl,
      address: s.address,
      isVerified: s.isVerified,
      isFeatured: s.isFeatured,
      district: s.district,
      barberCount: s._count.barbers,
      ratingAvg,
      ratingCount,
    };
  });

  const pref = params.preferredDistrictId;
  if (pref && !district) {
    mapped.sort((a, b) => Number(b.district?.id === pref) - Number(a.district?.id === pref));
  }
  return mapped;
}

/** Full public shop profile, or null if not found/deleted. */
// Wrapped in React cache so generateMetadata + the page share one query per request.
export const getShopProfile = cache(async (slug: string) => {
  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      logoUrl: true,
      coverUrl: true,
      address: true,
      phone: true,
      instagram: true,
      isVerified: true,
      deletedAt: true,
      district: { select: { id: true, nameEn: true, nameHy: true, slug: true } },
      photos: { orderBy: { sortOrder: 'asc' }, select: { id: true, url: true } },
      services: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
        select: { id: true, type: true, name: true, description: true, durationMin: true, priceAmd: true },
      },
      barbers: {
        where: { deletedAt: null },
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
        },
      },
    },
  });
  if (!shop || shop.deletedAt) return null;
  return {
    ...shop,
    barbers: shop.barbers.map((b) => ({ ...b, ratingAvg: Number(b.ratingAvg) })),
  };
});
