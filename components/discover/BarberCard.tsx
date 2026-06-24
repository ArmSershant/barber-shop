'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { Avatar, Badge, Button, Card, Group, Stack, Text } from '@mantine/core';
import {
  IconStarFilled,
  IconBuildingStore,
  IconUser,
  IconCalendarPlus,
  IconRosetteDiscountCheckFilled,
} from '@tabler/icons-react';
import type { BarberCardData } from '@/lib/queries/barbers';

export function BarberCard({ barber }: { barber: BarberCardData }) {
  const t = useTranslations('discover');
  const locale = useLocale();
  const hasShop = !!barber.shop?.name;
  const districtName = barber.district
    ? locale === 'hy'
      ? barber.district.nameHy
      : barber.district.nameEn
    : null;
  const subtitle = [barber.shop?.name ?? t('independent'), districtName].filter(Boolean).join(' · ');

  return (
    <Card
      withBorder
      radius="xs"
      padding="lg"
      className={`hoverLift${barber.isFeatured ? ' offsetShadow' : ''}`}
      style={barber.isFeatured ? { borderColor: 'var(--gold)' } : undefined}
    >
      {barber.isFeatured && (
        <Badge size="xs" color="gold" variant="light" mb="xs" leftSection={<IconStarFilled size={9} />}>
          {t('featured')}
        </Badge>
      )}
      <Group wrap="nowrap">
        <Avatar src={barber.photoUrl ?? undefined} radius="xl" size="lg" color="gold">
          {barber.displayName.charAt(0).toUpperCase()}
        </Avatar>
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Group gap={4} wrap="nowrap">
            <Text fw={700} truncate ff="var(--font-display), Georgia, serif" fz="1.2rem">
              {barber.displayName}
            </Text>
            {barber.isVerified && (
              <IconRosetteDiscountCheckFilled
                size={16}
                color="var(--gold)"
                aria-label={t('verified')}
              />
            )}
          </Group>
          <Group gap={4} wrap="nowrap" c="dimmed">
            {hasShop ? <IconBuildingStore size={14} /> : <IconUser size={14} />}
            <Text size="sm" truncate>
              {subtitle}
            </Text>
          </Group>
        </Stack>
      </Group>

      <Group justify="space-between" mt="md">
        {barber.ratingCount > 0 ? (
          <Group gap={4} wrap="nowrap">
            <IconStarFilled size={14} color="var(--mantine-color-gold-6)" />
            <Text size="sm" fw={500}>
              {barber.ratingAvg.toFixed(1)}
            </Text>
            <Text size="sm" c="dimmed">
              ({barber.ratingCount})
            </Text>
          </Group>
        ) : (
          <Text size="sm" c="dimmed">
            {t('noReviews')}
          </Text>
        )}
        <Button
          component={Link}
          href={`/barbers/${barber.slug}` as Route}
          size="xs"
          variant="light"
          leftSection={<IconCalendarPlus size={14} />}
        >
          {t('book')}
        </Button>
      </Group>
    </Card>
  );
}
