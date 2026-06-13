'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Avatar, Button, Card, Group, Stack, Text } from '@mantine/core';
import { IconStarFilled, IconBuildingStore, IconUser, IconCalendarPlus } from '@tabler/icons-react';
import type { BarberCardData } from '@/lib/queries/barbers';

export function BarberCard({ barber }: { barber: BarberCardData }) {
  const t = useTranslations('discover');
  const hasShop = !!barber.shop?.name;

  return (
    <Card withBorder radius="md" padding="lg" className="hoverLift">
      <Group wrap="nowrap">
        <Avatar src={barber.photoUrl ?? undefined} radius="xl" size="lg" color="teal">
          {barber.displayName.charAt(0).toUpperCase()}
        </Avatar>
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} truncate>
            {barber.displayName}
          </Text>
          <Group gap={4} wrap="nowrap" c="dimmed">
            {hasShop ? <IconBuildingStore size={14} /> : <IconUser size={14} />}
            <Text size="sm" truncate>
              {barber.shop?.name ?? t('independent')}
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
