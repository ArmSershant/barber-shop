'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { useGetDistrictsQuery } from '@/lib/store/api';
import styles from './DistrictFilterChips.module.scss';

/** Horizontal-scrolling district quick-filters. Updates ?district= in place,
 * preserving the current search query and sort. */
export function DistrictFilterChips({ basePath }: { basePath: '/barbers' | '/shops' }) {
  const t = useTranslations('discover');
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const { data } = useGetDistrictsQuery();
  const active = params.get('district') ?? '';

  const go = (district: string) => {
    const next = new URLSearchParams(params.toString());
    if (district) next.set('district', district);
    else next.delete('district');
    const qs = next.toString();
    router.push(`${basePath}${qs ? `?${qs}` : ''}` as Route);
  };

  const chips = [{ slug: '', label: t('allDistricts') }, ...(data?.districts ?? []).map((d) => ({
    slug: d.slug,
    label: locale === 'hy' ? d.nameHy : d.nameEn,
  }))];

  return (
    <div className={styles.row}>
      {chips.map((c) => (
        <button
          key={c.slug || 'all'}
          type="button"
          onClick={() => go(c.slug)}
          className={`${styles.chip} ${active === c.slug ? styles.active : ''}`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
