'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Chip, Group, Select } from '@mantine/core';

/** Rating + "open now" filters for discovery, driven by URL params. */
export function DiscoveryFilters({
  basePath,
  showOpenNow = false,
}: {
  basePath: '/barbers' | '/shops';
  showOpenNow?: boolean;
}) {
  const t = useTranslations('discover');
  const router = useRouter();
  const params = useSearchParams();

  const push = (mut: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(params.toString());
    mut(p);
    const qs = p.toString();
    router.push(`${basePath}${qs ? `?${qs}` : ''}` as Route);
  };

  const rating = params.get('rating') ?? '';
  const openNow = params.get('open') === '1';

  return (
    <Group gap="sm" wrap="wrap">
      <Select
        placeholder={t('ratingAny')}
        data={[
          { value: '', label: t('ratingAny') },
          { value: '4', label: t('ratingMin', { n: 4 }) },
          { value: '4.5', label: t('ratingMin', { n: 4.5 }) },
        ]}
        value={rating}
        onChange={(v) =>
          push((p) => {
            if (v) p.set('rating', v);
            else p.delete('rating');
          })
        }
        w={150}
        allowDeselect={false}
        aria-label={t('ratingLabel')}
      />
      {showOpenNow && (
        <Chip
          checked={openNow}
          onChange={(checked) =>
            push((p) => {
              if (checked) p.set('open', '1');
              else p.delete('open');
            })
          }
          variant="outline"
        >
          {t('openNow')}
        </Chip>
      )}
    </Group>
  );
}
