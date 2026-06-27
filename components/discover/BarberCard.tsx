'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { Box, Card, Group, Stack, Text } from '@mantine/core';
import {
  IconStarFilled,
  IconBuildingStore,
  IconUser,
  IconRosetteDiscountCheckFilled,
} from '@tabler/icons-react';
import type { BarberCardData } from '@/lib/queries/barbers';
import styles from './DiscoveryCard.module.scss';

const absoluteImage = (url: string | null | undefined) =>
  url && /^https?:\/\//.test(url) ? url : undefined;

export function BarberCard({ barber }: { barber: BarberCardData }) {
  const t = useTranslations('discover');
  const tp = useTranslations('profile');
  const locale = useLocale();
  const hasShop = !!barber.shop?.name;
  const districtName = barber.district
    ? locale === 'hy'
      ? barber.district.nameHy
      : barber.district.nameEn
    : null;
  const subtitle = [barber.shop?.name ?? t('independent'), districtName].filter(Boolean).join(' · ');
  const cover = absoluteImage(barber.coverUrl);
  const avatar = absoluteImage(barber.photoUrl);

  return (
    <Card
      component={Link}
      href={`/barbers/${barber.slug}` as Route}
      withBorder
      radius="xs"
      padding={0}
      className={`hoverLift ${styles.card}${barber.isFeatured ? ` offsetShadow ${styles.featured}` : ''}`}
    >
      {/* Cover photo — striped placeholder until a real image is uploaded. */}
      <Box className={`${styles.cover} ${cover ? '' : 'placeholderStripes'}`}>
        {cover && <NextImage src={cover} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover' }} />}
        {barber.isFeatured && (
          <span className={styles.featuredTag}>
            <IconStarFilled size={10} /> {t('featured')}
          </span>
        )}

        {/* Barber avatar, overlapping the cover's bottom-left edge. */}
        <div className={styles.avatar}>
          {avatar ? (
            <NextImage src={avatar} alt="" fill sizes="160px" quality={90} style={{ objectFit: 'cover' }} />
          ) : (
            <span>{barber.displayName.charAt(0).toUpperCase()}</span>
          )}
        </div>
      </Box>

      <Stack gap={4} px="md" pb="md" pt={46}>
        <Group gap={4} wrap="nowrap">
          <Text fw={700} truncate ff="var(--font-display), Georgia, serif" fz="1.2rem">
            {barber.displayName}
          </Text>
          {barber.isVerified && (
            <IconRosetteDiscountCheckFilled size={16} color="var(--gold)" aria-label={t('verified')} />
          )}
        </Group>

        <Group gap={4} wrap="nowrap" c="dimmed">
          {hasShop ? <IconBuildingStore size={14} /> : <IconUser size={14} />}
          <Text size="sm" truncate>
            {subtitle}
          </Text>
        </Group>

        <Group justify="space-between" wrap="nowrap" mt={4}>
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
          {barber.minPrice != null && (
            <Text size="sm" fw={600} c="var(--gold)" style={{ whiteSpace: 'nowrap' }}>
              {tp('from', { price: barber.minPrice.toLocaleString() })}
            </Text>
          )}
        </Group>
      </Stack>
    </Card>
  );
}
