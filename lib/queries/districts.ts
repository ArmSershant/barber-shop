import { prisma } from '@/lib/db';

export interface DistrictItem {
  id: number;
  nameEn: string;
  nameHy: string;
  slug: string;
}

export async function listDistricts(): Promise<DistrictItem[]> {
  return prisma.district.findMany({
    orderBy: { nameEn: 'asc' },
    select: { id: true, nameEn: true, nameHy: true, slug: true },
  });
}

/** Look up a single district by its slug, or null. */
export async function getDistrictBySlug(slug: string): Promise<DistrictItem | null> {
  return prisma.district.findUnique({
    where: { slug },
    select: { id: true, nameEn: true, nameHy: true, slug: true },
  });
}

/** The user's saved home district (id + names), or null. */
export async function getPreferredDistrict(userId: string): Promise<DistrictItem | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferredDistrictId: true },
  });
  if (!user?.preferredDistrictId) return null;
  return prisma.district.findUnique({
    where: { id: user.preferredDistrictId },
    select: { id: true, nameEn: true, nameHy: true, slug: true },
  });
}
