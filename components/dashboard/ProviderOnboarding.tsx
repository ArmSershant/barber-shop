'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button, Card, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconBuildingStore, IconScissors } from '@tabler/icons-react';

/** Shown on the dashboard when a provider hasn't created their shop/barber
 * profile yet. Offers the role-relevant setup path(s). */
export function ProviderOnboarding({
  isShopOwner,
  isBarber,
}: {
  isShopOwner: boolean;
  isBarber: boolean;
}) {
  const t = useTranslations('onboarding');
  const both = isShopOwner && isBarber;

  const card = (
    icon: React.ReactNode,
    title: string,
    desc: string,
    cta: string,
    filled: boolean,
  ) => (
    <Card withBorder radius="xs" padding="xl" className="offsetShadow">
      <Stack gap="sm" align="flex-start">
        <ThemeIcon size={44} radius="xs" variant="outline" color="gold">
          {icon}
        </ThemeIcon>
        <Text fw={700} fz="xl" ff="var(--font-display), Georgia, serif">
          {title}
        </Text>
        <Text size="sm" c="dimmed">
          {desc}
        </Text>
        <Button
          component={Link}
          href="/dashboard/profile"
          variant={filled ? 'filled' : 'outline'}
          color={filled ? 'espresso' : 'ox'}
          mt="xs"
        >
          {cta}
        </Button>
      </Stack>
    </Card>
  );

  return (
    <Stack gap="xl">
      <Stack align="center" gap={6} ta="center">
        <Title order={2} ff="var(--font-display), Georgia, serif">
          {t('title')}
        </Title>
        <Text c="dimmed" maw={440}>
          {t('subtitle')}
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: both ? 2 : 1 }} spacing="lg" maw={both ? undefined : 460} mx="auto" w="100%">
        {isShopOwner &&
          card(<IconBuildingStore size={24} />, t('shopTitle'), t('shopDesc'), t('shopCta'), true)}
        {isBarber &&
          card(<IconScissors size={24} />, t('barberTitle'), t('barberDesc'), t('barberCta'), !isShopOwner)}
      </SimpleGrid>
    </Stack>
  );
}
