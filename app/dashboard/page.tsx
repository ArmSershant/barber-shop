'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import {
  Alert,
  Anchor,
  Button,
  Center,
  Container,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconExternalLink, IconPencil } from '@tabler/icons-react';
import {
  useMeQuery,
  useProviderMeQuery,
  useGetProviderBookingsQuery,
  type ProviderBooking,
} from '@/lib/store/api';
import { AnalyticsSection } from '@/components/dashboard/AnalyticsSection';
import { ProviderOnboarding } from '@/components/dashboard/ProviderOnboarding';
import { BookingRow } from '@/components/dashboard/BookingRow';
import { SectionHeader } from '@/components/profile/SectionHeader';
import { StatusPill } from '@/components/StatusPill';
import { ListSkeleton } from '@/components/ListSkeleton';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tb = useTranslations('providerBookings');
  const tst = useTranslations('serviceTypes');
  const svcLabel = (s: { type: string | null; name: string }) =>
    s.type && s.type !== 'other' ? tst(s.type) : s.name;
  const { data: me, isLoading: meLoading } = useMeQuery();
  const { data: provider, isLoading: provLoading } = useProviderMeQuery();
  const { data: bookingsData, isLoading: bookingsLoading } = useGetProviderBookingsQuery();

  if (meLoading) {
    return (
      <Center py={80}>
        <Loader />
      </Center>
    );
  }

  const user = me?.user ?? null;
  if (!user) {
    return (
      <Container size="sm" py="xl">
        <Alert color="blue">
          {t('loginRequired')} <Anchor component={Link} href="/login">{t('loginLink')}</Anchor>
        </Alert>
      </Container>
    );
  }

  const isShopOwner = user.roles.includes('shop_owner');
  const isBarber = user.roles.includes('barber');
  const isProvider = isShopOwner || isBarber;

  const publicHref: Route | null = provider?.shop
    ? (`/shops/${provider.shop.slug}` as Route)
    : provider?.barber
      ? (`/barbers/${provider.barber.slug}` as Route)
      : null;

  // Split bookings into today's agenda vs. the next upcoming ones.
  const bookings = bookingsData?.bookings ?? [];
  const startOfTomorrow = new Date();
  startOfTomorrow.setHours(24, 0, 0, 0);
  const active = (b: ProviderBooking) => b.status === 'confirmed' || b.status === 'requested';
  const today = bookings
    .filter((b) => active(b) && new Date(b.startsAt).getTime() < startOfTomorrow.getTime())
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const upcoming = bookings
    .filter((b) => active(b) && new Date(b.startsAt).getTime() >= startOfTomorrow.getTime())
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
    .slice(0, 5);

  const rowFor = (b: ProviderBooking) => (
    <BookingRow
      key={b.id}
      date={new Date(b.startsAt)}
      title={b.customerName}
      subtitle={`${b.barberName} · ${b.services.map(svcLabel).join(', ')}`}
      right={
        <StatusPill
          status={b.status}
          label={b.status === 'requested' ? tb('statusRequested') : tb('statusConfirmed')}
        />
      }
    />
  );

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl" className="stagger">
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
          <Title order={2} ff="var(--font-display), Georgia, serif">
            {t('title')}
          </Title>
          {isProvider && (
            <Group gap="sm" wrap="nowrap">
              {publicHref && (
                <Button
                  component={Link}
                  href={publicHref}
                  variant="default"
                  size="xs"
                  leftSection={<IconExternalLink size={14} />}
                >
                  {t('viewProfile')}
                </Button>
              )}
              <Button
                component={Link}
                href="/dashboard/profile"
                size="xs"
                leftSection={<IconPencil size={14} />}
              >
                {t('editProfile')}
              </Button>
            </Group>
          )}
        </Group>

        {isProvider && !user.emailVerified && (
          <Alert color="yellow">
            {t('verifyToGoLive')}{' '}
            <Anchor component={Link} href="/account">
              {t('verifyToGoLiveLink')}
            </Anchor>
          </Alert>
        )}

        {!isProvider ? (
          <Text c="dimmed">{t('customerOnly')}</Text>
        ) : provLoading ? (
          <ListSkeleton rows={3} />
        ) : !provider?.shop && !provider?.barber ? (
          <ProviderOnboarding isShopOwner={isShopOwner} isBarber={isBarber} />
        ) : (
          <>
            {((isShopOwner && provider?.shop) || (isBarber && provider?.barber)) && <AnalyticsSection />}

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
              <Stack gap="sm">
                <SectionHeader>{t('todaysAgenda')}</SectionHeader>
                {bookingsLoading ? (
                  <ListSkeleton rows={2} />
                ) : today.length === 0 ? (
                  <Text c="dimmed" size="sm">
                    {t('noToday')}
                  </Text>
                ) : (
                  today.map(rowFor)
                )}
              </Stack>

              <Stack gap="sm">
                <Group justify="space-between" align="flex-end">
                  <div style={{ flex: 1 }}>
                    <SectionHeader>{t('upcoming')}</SectionHeader>
                  </div>
                  <Anchor component={Link} href="/dashboard/bookings" size="sm" c="dimmed">
                    {t('viewAllBookings')} →
                  </Anchor>
                </Group>
                {bookingsLoading ? (
                  <ListSkeleton rows={2} />
                ) : upcoming.length === 0 ? (
                  <Text c="dimmed" size="sm">
                    {t('noUpcoming')}
                  </Text>
                ) : (
                  upcoming.map(rowFor)
                )}
              </Stack>
            </SimpleGrid>
          </>
        )}
      </Stack>
    </Container>
  );
}
