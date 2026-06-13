import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barber-shop.am';

// Re-generate at most once per hour.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [barbers, shops, districts] = await Promise.all([
    prisma.barber.findMany({
      where: { deletedAt: null, status: 'active' },
      select: { slug: true },
    }),
    prisma.shop.findMany({
      where: { deletedAt: null, status: 'active' },
      select: { slug: true },
    }),
    prisma.district.findMany({ select: { slug: true } }),
  ]);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/barbers`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/shops`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
  ];

  const barberPages: MetadataRoute.Sitemap = barbers.map((b) => ({
    url: `${siteUrl}/barbers/${b.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const shopPages: MetadataRoute.Sitemap = shops.map((s) => ({
    url: `${siteUrl}/shops/${s.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const districtPages: MetadataRoute.Sitemap = districts.flatMap((d) => [
    {
      url: `${siteUrl}/barbers/district/${d.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${siteUrl}/shops/district/${d.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]);

  return [...staticPages, ...barberPages, ...shopPages, ...districtPages];
}
