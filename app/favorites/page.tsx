import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Alert, Anchor, Container, SimpleGrid, Stack, Title } from '@mantine/core';
import { IconHeart } from '@tabler/icons-react';
import { EmptyState } from '@/components/EmptyState';
import { BarberCard } from '@/components/discover/BarberCard';
import { getCurrentUser } from '@/lib/auth/session';
import { getFavoriteBarbers } from '@/lib/queries/favorites';

export const metadata: Metadata = { title: 'Saved barbers', robots: { index: false } };

export default async function FavoritesPage() {
  const t = await getTranslations('favorites');
  const td = await getTranslations('dashboard');
  const viewer = await getCurrentUser();

  if (!viewer) {
    return (
      <Container size="sm" py="xl">
        <Alert color="blue">
          {td('loginRequired')} <Anchor component={Link} href="/login">{td('loginLink')}</Anchor>
        </Alert>
      </Container>
    );
  }

  const barbers = await getFavoriteBarbers(viewer.userId);

  return (
    <Container size="lg" py="xl">
      <Stack gap="md" className="stagger">
        <Title order={2}>{t('title')}</Title>
        {barbers.length === 0 ? (
          <EmptyState icon={<IconHeart size={30} />} title={t('empty')} />
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
