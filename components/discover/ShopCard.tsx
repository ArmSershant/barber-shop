'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { Avatar, Button, Card, Group, Stack, Text } from '@mantine/core';
import type { ShopCardData } from '@/lib/queries/shops';

export function ShopCard({ shop }: { shop: ShopCardData }) {
  const t = useTranslations('discover');
  const locale = useLocale();
  const districtName = shop.district
    ? locale === 'hy'
      ? shop.district.nameHy
      : shop.district.nameEn
    : null;

  return (
    <Card withBorder radius="md" padding="lg">
      <Group wrap="nowrap">
        <Avatar src={shop.logoUrl ?? undefined} radius="md" size="lg" color="teal">
          {shop.name.charAt(0).toUpperCase()}
        </Avatar>
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} truncate>
            {shop.name}
          </Text>
          <Text size="sm" c="dimmed" truncate>
            {[districtName, shop.address].filter(Boolean).join(' · ')}
          </Text>
        </Stack>
      </Group>

      <Group justify="space-between" mt="md">
        <Text size="sm" c="dimmed">
          {t('barberCount', { count: shop.barberCount })}
        </Text>
        <Button component={Link} href={`/shops/${shop.slug}` as Route} size="xs" variant="light">
          {t('view')}
        </Button>
      </Group>
    </Card>
  );
}
