import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { Anchor, Container, Group, SimpleGrid, Stack, Title } from '@mantine/core';
import { IconMoodEmpty } from '@tabler/icons-react';
import { EmptyState } from '@/components/EmptyState';
import { listBarbers } from '@/lib/queries/barbers';
import { getDistrictBySlug } from '@/lib/queries/districts';
import { BarberCard } from '@/components/discover/BarberCard';

type Params = { params: Promise<{ district: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { district: slug } = await params;
  const district = await getDistrictBySlug(slug);
  if (!district) return { title: 'District not found' };
  const title = `Barbers in ${district.nameEn}, Yerevan`;
  const description = `Find and book barbers in ${district.nameEn}, Yerevan. Browse profiles, services, prices and reviews, and book online.`;
  return {
    title,
    description,
    alternates: { canonical: `/barbers/district/${slug}` },
    openGraph: { title: `${title} — Barber-Shop`, description, url: `/barbers/district/${slug}` },
  };
}

export default async function BarbersByDistrictPage({ params }: Params) {
  const { district: slug } = await params;
  const district = await getDistrictBySlug(slug);
  if (!district) notFound();

  const locale = await getLocale();
  const t = await getTranslations('discover');
  const name = locale === 'hy' ? district.nameHy : district.nameEn;
  const barbers = await listBarbers({ district: slug });

  return (
    <Container size="lg" py="xl">
      <Stack gap="md" className="stagger">
        <Group justify="space-between" align="baseline">
          <Title order={2}>{t('barbersInDistrict', { district: name })}</Title>
          <Anchor component={Link} href="/barbers" size="sm">
            {t('barbersTitle')}
          </Anchor>
        </Group>

        {barbers.length === 0 ? (
          <EmptyState icon={<IconMoodEmpty size={30} />} title={t('empty')} />
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" className="stagger">
            {barbers.map((barber) => (
              <BarberCard key={barber.id} barber={barber} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}
