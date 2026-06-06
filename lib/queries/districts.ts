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
