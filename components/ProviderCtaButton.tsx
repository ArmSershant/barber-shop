'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { useMeQuery } from '@/lib/store/api';

/** Home "for providers" CTA — sends existing providers to their dashboard
 * instead of the (pointless-when-logged-in) register page. */
export function ProviderCtaButton() {
  const t = useTranslations('home');
  const roles = useMeQuery().data?.user?.roles ?? [];
  const isProvider =
    roles.includes('shop_owner') || roles.includes('barber') || roles.includes('admin');

  return (
    <Button
      component={Link}
      href={isProvider ? '/dashboard' : '/register'}
      variant="default"
      rightSection={<IconArrowRight size={18} />}
    >
      {isProvider ? t('providerCtaDashboard') : t('providerCta')}
    </Button>
  );
}
