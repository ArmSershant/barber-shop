'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Avatar, Button, Card, Group, Stack, Text } from '@mantine/core';
import type { BarberCardData } from '@/lib/queries/barbers';

export function BarberCard({ barber }: { barber: BarberCardData }) {
  const t = useTranslations('discover');

  return (
    <Card withBorder radius="md" padding="lg">
      <Group wrap="nowrap">
        <Avatar src={barber.photoUrl ?? undefined} radius="xl" size="lg" color="teal">
          {barber.displayName.charAt(0).toUpperCase()}
        </Avatar>
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} truncate>
            {barber.displayName}
          </Text>
          <Text size="sm" c="dimmed" truncate>
            {barber.shop?.name ?? t('independent')}
          </Text>
        </Stack>
      </Group>

      <Group justify="space-between" mt="md">
        <Text size="sm" c="dimmed">
          {barber.ratingCount > 0
            ? `★ ${barber.ratingAvg.toFixed(1)} (${barber.ratingCount})`
            : t('noReviews')}
        </Text>
        <Button component={Link} href={`/barbers/${barber.slug}` as Route} size="xs" variant="light">
          {t('book')}
        </Button>
      </Group>
    </Card>
  );
}
