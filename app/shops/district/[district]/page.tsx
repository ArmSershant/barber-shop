import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { Anchor, Container, Group, SimpleGrid, Stack, Title } from '@mantine/core';
import { IconBuildingStore } from '@tabler/icons-react';
import { EmptyState } from '@/components/EmptyState';
import { listShops } from '@/lib/queries/shops';
import { getDistrictBySlug } from '@/lib/queries/districts';
import { ShopCard } from '@/components/discover/ShopCard';

type Params = { params: Promise<{ district: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { district: slug } = await params;
  const district = await getDistrictBySlug(slug);
  if (!district) return { title: 'District not found' };
  const title = `Barbershops in ${district.nameEn}, Yerevan`;
  const description = `Discover barbershops in ${district.nameEn}, Yerevan. View services, barbers and prices, and book your appointment online.`;
  return {
    title,
    description,
    alternates: { canonical: `/shops/district/${slug}` },
    openGraph: { title: `${title} — Barber-Shop`, description, url: `/shops/district/${slug}` },
  };
}

export default async function ShopsByDistrictPage({ params }: Params) {
  const { district: slug } = await params;
  const district = await getDistrictBySlug(slug);
  if (!district) notFound();

  const locale = await getLocale();
  const t = await getTranslations('discover');
  const name = locale === 'hy' ? district.nameHy : district.nameEn;
  const shops = await listShops({ district: slug });

  return (
    <Container size="lg" py="xl">
      <Stack gap="md" className="stagger">
        <Group justify="space-between" align="baseline">
          <Title order={2}>{t('shopsInDistrict', { district: name })}</Title>
          <Anchor component={Link} href="/shops" size="sm">
            {t('shopsTitle')}
          </Anchor>
        </Group>

        {shops.length === 0 ? (
          <EmptyState icon={<IconBuildingStore size={30} />} title={t('emptyShops')} />
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" className="stagger">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}
