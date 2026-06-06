import { prisma } from '@/lib/db';

export interface ShopCardData {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  district: { id: number; nameEn: string; nameHy: string; slug: string } | null;
  barberCount: number;
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
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
      ...(district ? { district: { slug: district } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 60,
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      address: true,
      district: { select: { id: true, nameEn: true, nameHy: true, slug: true } },
      _count: { select: { barbers: { where: { deletedAt: null } } } },
    },
  });
  const mapped = shops.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    logoUrl: s.logoUrl,
    address: s.address,
    district: s.district,
    barberCount: s._count.barbers,
  }));

  const pref = params.preferredDistrictId;
  if (pref && !district) {
    mapped.sort((a, b) => Number(b.district?.id === pref) - Number(a.district?.id === pref));
  }
  return mapped;
}

/** Full public shop profile, or null if not found/deleted. */
export async function getShopProfile(slug: string) {
  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      logoUrl: true,
      address: true,
      phone: true,
      instagram: true,
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
        },
      },
    },
  });
  if (!shop || shop.deletedAt) return null;
  return {
    ...shop,
    barbers: shop.barbers.map((b) => ({ ...b, ratingAvg: Number(b.ratingAvg) })),
  };
}
