'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { Avatar, Button, Card, Group, Stack, Text } from '@mantine/core';
import { IconMapPin, IconUsers, IconArrowRight } from '@tabler/icons-react';
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
    <Card withBorder radius="md" padding="lg" className="hoverLift">
      <Group wrap="nowrap">
        <Avatar src={shop.logoUrl ?? undefined} radius="md" size="lg" color="teal">
          {shop.name.charAt(0).toUpperCase()}
        </Avatar>
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} truncate>
            {shop.name}
          </Text>
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
          variant="light"
          rightSection={<IconArrowRight size={14} />}
        >
          {t('view')}
        </Button>
      </Group>
    </Card>
  );
}
