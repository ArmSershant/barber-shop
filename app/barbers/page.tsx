import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Container, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconMoodEmpty } from '@tabler/icons-react';

export const metadata: Metadata = {
  title: 'Barbers in Yerevan',
  description:
    'Browse independent barbers and barbershop barbers across Yerevan. Filter by district and book online in seconds.',
  alternates: { canonical: '/barbers' },
  openGraph: {
    title: 'Barbers in Yerevan — Barber-Shop',
    description: 'Browse and book barbers across Yerevan.',
    url: '/barbers',
  },
};
import { EmptyState } from '@/components/EmptyState';
import { listBarbers, type BarberSort } from '@/lib/queries/barbers';
import { getPreferredDistrict } from '@/lib/queries/districts';
import { getCurrentUser } from '@/lib/auth/session';
import { BarberCard } from '@/components/discover/BarberCard';
import { BarberSearch } from '@/components/discover/BarberSearch';
import { DistrictFilterChips } from '@/components/discover/DistrictFilterChips';
import { SortSelect } from '@/components/discover/SortSelect';
import { DiscoveryFilters } from '@/components/discover/DiscoveryFilters';

export default async function BarbersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; district?: string; sort?: string; rating?: string; open?: string }>;
}) {
  const { q, district, sort, rating, open } = await searchParams;
  const t = await getTranslations('discover');
  const locale = await getLocale();
  const sortValue: BarberSort = sort === 'new' || sort === 'price' ? sort : 'top';
  const minRating = rating ? Number(rating) : undefined;

  const viewer = await getCurrentUser();
  const pref = viewer ? await getPreferredDistrict(viewer.userId) : null;
  const barbers = await listBarbers({
    q,
    district,
    sort: sortValue,
    minRating,
    openNow: open === '1',
    preferredDistrictId: district ? undefined : pref?.id,
    includeTest: viewer?.roles?.includes('admin') ?? false,
  });
  const showHint = pref && !district && barbers.length > 0;

  return (
    <Container size="lg" py="xl">
      <Stack gap="md" className="stagger">
        <Group align="baseline" gap="sm" wrap="wrap">
          <Title order={2} ff="var(--font-display), Georgia, serif">
            {t('barbersTitle')}
          </Title>
          <Text c="dimmed" fz="sm">
            {t('inYerevan', { count: barbers.length })}
          </Text>
        </Group>

        <Group align="flex-end" wrap="wrap" gap="sm">
          <div style={{ flex: 1, minWidth: 200 }}>
            <BarberSearch initialQuery={q ?? ''} />
          </div>
          <SortSelect />
        </Group>

        <Group gap="sm" wrap="wrap">
          <DiscoveryFilters basePath="/barbers" showOpenNow />
        </Group>

        <DistrictFilterChips basePath="/barbers" />

        {showHint && (
          <Text size="sm" c="dimmed">
            {t('showingFirst', { district: locale === 'hy' ? pref!.nameHy : pref!.nameEn })}
          </Text>
        )}

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
