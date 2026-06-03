'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Alert, Anchor, Center, Container, Loader, Stack, Text, Title } from '@mantine/core';
import { useMeQuery, useProviderMeQuery } from '@/lib/store/api';
import { ShopForm } from '@/components/dashboard/ShopForm';
import { BarberForm } from '@/components/dashboard/BarberForm';
import { ServicesSection } from '@/components/dashboard/ServicesSection';
import { WorkingHoursSection } from '@/components/dashboard/WorkingHoursSection';
import { TimeOffSection } from '@/components/dashboard/TimeOffSection';
import { BreaksSection } from '@/components/dashboard/BreaksSection';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { data: me, isLoading: meLoading } = useMeQuery();
  const { data: provider, isLoading: provLoading } = useProviderMeQuery();

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

  return (
    <Container size="sm" py="xl">
      <Stack>
        <Title order={2}>{t('title')}</Title>

        {provLoading ? (
          <Center py={40}>
            <Loader />
          </Center>
        ) : (
          <>
            {isShopOwner && <ShopForm shop={provider?.shop ?? null} />}
            {isBarber && <BarberForm barber={provider?.barber ?? null} />}
            {((isShopOwner && provider?.shop) || (isBarber && provider?.barber)) && <ServicesSection />}
            {isBarber && provider?.barber && (
              <>
                <WorkingHoursSection barberSlug={provider.barber.slug} />
                <BreaksSection barberSlug={provider.barber.slug} />
                <TimeOffSection barberSlug={provider.barber.slug} />
              </>
            )}
            {!isShopOwner && !isBarber && <Text c="dimmed">{t('customerOnly')}</Text>}
          </>
        )}
      </Stack>
    </Container>
  );
}
