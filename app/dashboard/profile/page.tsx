'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Alert, Anchor, Center, Container, Loader, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useMeQuery, useProviderMeQuery } from '@/lib/store/api';
import { ShopForm } from '@/components/dashboard/ShopForm';
import { BarberForm } from '@/components/dashboard/BarberForm';
import { ServicesSection } from '@/components/dashboard/ServicesSection';
import { WorkingHoursSection } from '@/components/dashboard/WorkingHoursSection';
import { TimeOffSection } from '@/components/dashboard/TimeOffSection';
import { BreaksSection } from '@/components/dashboard/BreaksSection';
import { ShopRosterSection } from '@/components/dashboard/ShopRosterSection';
import { ShopDefaultsSection } from '@/components/dashboard/ShopDefaultsSection';
import { BarberPortfolioSection, ShopPhotosSection } from '@/components/dashboard/GallerySection';
import { ListSkeleton } from '@/components/ListSkeleton';

export default function ProviderProfilePage() {
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
      <Stack className="stagger">
        <Anchor component={Link} href="/dashboard" size="sm" c="dimmed">
          <IconArrowLeft size={14} style={{ verticalAlign: '-2px' }} /> {t('title')}
        </Anchor>
        <Title order={2} ff="var(--font-display), Georgia, serif">
          {t('editProfile')}
        </Title>

        {(isShopOwner || isBarber) && !user.emailVerified && (
          <Alert color="yellow">
            {t('verifyToGoLive')}{' '}
            <Anchor component={Link} href="/account">
              {t('verifyToGoLiveLink')}
            </Anchor>
          </Alert>
        )}

        {provLoading ? (
          <ListSkeleton rows={3} />
        ) : (
          <>
            {isShopOwner && <ShopForm shop={provider?.shop ?? null} />}
            {isShopOwner && provider?.shop && <ShopPhotosSection slug={provider.shop.slug} />}
            {isBarber && <BarberForm barber={provider?.barber ?? null} />}
            {isBarber && provider?.barber && <BarberPortfolioSection slug={provider.barber.slug} />}
            {((isShopOwner && provider?.shop) || (isBarber && provider?.barber)) && <ServicesSection />}
            {isShopOwner && provider?.shop && <ShopDefaultsSection shopSlug={provider.shop.slug} />}
            {isShopOwner && provider?.shop && <ShopRosterSection shopSlug={provider.shop.slug} />}
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
