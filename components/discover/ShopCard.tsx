'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { Avatar, Box, Button, Card, Group, Stack, Text } from '@mantine/core';
import {
  IconMapPin,
  IconUsers,
  IconStarFilled,
  IconArrowRight,
  IconRosetteDiscountCheckFilled,
} from '@tabler/icons-react';
import type { ShopCardData } from '@/lib/queries/shops';
import styles from './DiscoveryCard.module.scss';

const absoluteImage = (url: string | null | undefined) =>
  url && /^https?:\/\//.test(url) ? url : undefined;

export function ShopCard({ shop }: { shop: ShopCardData }) {
  const t = useTranslations('discover');
  const locale = useLocale();
  const districtName = shop.district
    ? locale === 'hy'
      ? shop.district.nameHy
      : shop.district.nameEn
    : null;
  const cover = absoluteImage(shop.coverUrl) ?? absoluteImage(shop.logoUrl);

  return (
    <Card
      component={Link}
      href={`/shops/${shop.slug}` as Route}
      withBorder
      radius="xs"
      padding={0}
      className={`hoverLift ${styles.shopCard}${shop.isFeatured ? ` offsetShadow ${styles.featured}` : ''}`}
    >
      {/* Photo thumbnail — striped placeholder until a real image is uploaded. */}
      <Box className={`${styles.shopThumb} ${cover ? '' : 'placeholderStripes'}`}>
        {cover && <NextImage src={cover} alt="" fill sizes="104px" style={{ objectFit: 'cover' }} />}
        {shop.discountPercent > 0 && <span className={styles.discountTag}>−{shop.discountPercent}%</span>}
      </Box>

      <Stack gap={6} p="md" style={{ flex: 1, minWidth: 0 }}>
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <Avatar src={shop.logoUrl ?? undefined} radius="md" size="md" color="gold">
            {shop.name.charAt(0).toUpperCase()}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Group gap={4} wrap="nowrap">
              <Text fw={700} truncate ff="var(--font-display), Georgia, serif" fz="1.15rem">
                {shop.name}
              </Text>
              {shop.isVerified && (
                <IconRosetteDiscountCheckFilled size={15} color="var(--gold)" aria-label={t('verified')} />
              )}
            </Group>
            {districtName && (
              <Group gap={4} wrap="nowrap" c="dimmed">
                <IconMapPin size={13} />
                <Text size="xs" truncate>
                  {districtName}
                </Text>
              </Group>
            )}
          </div>
        </Group>

        <Group justify="space-between" wrap="nowrap" mt="auto">
          <Group gap={10} wrap="nowrap" c="dimmed">
            {shop.ratingCount > 0 && (
              <Group gap={3} wrap="nowrap">
                <IconStarFilled size={13} color="var(--mantine-color-gold-6)" />
                <Text size="sm" fw={500} c="var(--mantine-color-text)">
                  {shop.ratingAvg.toFixed(1)}
                </Text>
              </Group>
            )}
            <Group gap={3} wrap="nowrap">
              <IconUsers size={13} />
              <Text size="sm">{t('barberCount', { count: shop.barberCount })}</Text>
            </Group>
          </Group>
          <Button
            size="xs"
            px="md"
            variant="light"
            component="span"
            rightSection={<IconArrowRight size={14} />}
            styles={{ root: { flexShrink: 0 }, section: { marginInlineStart: 8 } }}
          >
            {t('view')}
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
