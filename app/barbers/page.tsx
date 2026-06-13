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
import { listBarbers } from '@/lib/queries/barbers';
import { getPreferredDistrict } from '@/lib/queries/districts';
import { getCurrentUser } from '@/lib/auth/session';
import { BarberCard } from '@/components/discover/BarberCard';
import { BarberSearch } from '@/components/discover/BarberSearch';
import { DistrictFilter } from '@/components/discover/DistrictFilter';

export default async function BarbersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; district?: string }>;
}) {
  const { q, district } = await searchParams;
  const t = await getTranslations('discover');
  const locale = await getLocale();

  const viewer = await getCurrentUser();
  const pref = viewer ? await getPreferredDistrict(viewer.userId) : null;
  const barbers = await listBarbers({
    q,
    district,
    preferredDistrictId: district ? undefined : pref?.id,
  });
  const showHint = pref && !district && barbers.length > 0;

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Title order={2}>{t('barbersTitle')}</Title>
        <Group align="flex-end" wrap="wrap">
          <div style={{ flex: 1, minWidth: 200 }}>
            <BarberSearch initialQuery={q ?? ''} />
          </div>
          <DistrictFilter basePath="/barbers" q={q ?? ''} value={district ?? ''} />
        </Group>
        {showHint && (
          <Text size="sm" c="dimmed">
            {t('showingFirst', { district: locale === 'hy' ? pref!.nameHy : pref!.nameEn })}
          </Text>
        )}

        {barbers.length === 0 ? (
          <EmptyState icon={<IconMoodEmpty size={30} />} title={t('empty')} />
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {barbers.map((barber) => (
              <BarberCard key={barber.id} barber={barber} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}
