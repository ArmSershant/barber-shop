'use client';

import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { Select } from '@mantine/core';
import { useGetDistrictsQuery } from '@/lib/store/api';

export function DistrictFilter({
  basePath,
  q,
  value,
}: {
  basePath: '/barbers' | '/shops';
  q: string;
  value: string;
}) {
  const t = useTranslations('discover');
  const locale = useLocale();
  const router = useRouter();
  const { data } = useGetDistrictsQuery();

  const options = (data?.districts ?? []).map((d) => ({
    value: d.slug,
    label: locale === 'hy' ? d.nameHy : d.nameEn,
  }));

  const onChange = (next: string | null) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (next) params.set('district', next);
    const qs = params.toString();
    router.push(`${basePath}${qs ? `?${qs}` : ''}` as Route);
  };

  return (
    <Select
      placeholder={t('allDistricts')}
      data={options}
      value={value || null}
      onChange={onChange}
      clearable
      w={220}
      aria-label={t('district')}
    />
  );
}
