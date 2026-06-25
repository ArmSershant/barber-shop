'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { Avatar, Badge, Button, Card, Group, Stack, Text } from '@mantine/core';
import {
  IconMapPin,
  IconUsers,
  IconArrowRight,
  IconRosetteDiscountCheckFilled,
} from '@tabler/icons-react';
import type { ShopCardData } from '@/lib/queries/shops';

export function ShopCard({ shop }: { shop: ShopCardData }) {
  const t = useTranslations('discover');
  const locale = useLocale();
  const districtName = shop.district
    ? locale === 'hy'
      ? shop.district.nameHy
      : shop.district.nameEn
    : null;
  const location = [districtName, shop.address].filter(Boolean).join(' · ');

  return (
    <Card
      withBorder
      radius="xs"
      padding="lg"
      className={`hoverLift${shop.isFeatured ? ' offsetShadow' : ''}`}
      style={shop.isFeatured ? { borderColor: 'var(--gold)' } : undefined}
    >
      {shop.isFeatured && (
        <Badge size="xs" color="gold" variant="light" mb="xs">
          {t('featured')}
        </Badge>
      )}
      <Group wrap="nowrap">
        <Avatar src={shop.logoUrl ?? undefined} radius="md" size="lg" color="gold">
          {shop.name.charAt(0).toUpperCase()}
        </Avatar>
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Group gap={4} wrap="nowrap">
            <Text fw={700} truncate ff="var(--font-display), Georgia, serif" fz="1.2rem">
              {shop.name}
            </Text>
            {shop.isVerified && (
              <IconRosetteDiscountCheckFilled
                size={16}
                color="var(--gold)"
                aria-label={t('verified')}
              />
            )}
          </Group>
          {location && (
            <Group gap={4} wrap="nowrap" c="dimmed">
              <IconMapPin size={14} />
              <Text size="sm" truncate>
                {location}
              </Text>
            </Group>
          )}
        </Stack>
      </Group>

      <Group justify="space-between" mt="md">
        <Group gap={4} wrap="nowrap" c="dimmed">
          <IconUsers size={14} />
          <Text size="sm">{t('barberCount', { count: shop.barberCount })}</Text>
        </Group>
        <Button
          component={Link}
          href={`/shops/${shop.slug}` as Route}
          size="xs"
          px="md"
          variant="light"
          rightSection={<IconArrowRight size={14} />}
          styles={{ root: { flexShrink: 0 }, section: { marginInlineStart: 8 } }}
        >
          {t('view')}
        </Button>
      </Group>
    </Card>
  );
}
