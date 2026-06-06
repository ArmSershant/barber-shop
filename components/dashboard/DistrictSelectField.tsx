'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Select } from '@mantine/core';
import { useGetDistrictsQuery } from '@/lib/store/api';

export function DistrictSelectField({
  value,
  onChange,
  error,
}: {
  value: number | null | undefined;
  onChange: (value: number | undefined) => void;
  error?: string;
}) {
  const t = useTranslations('discover');
  const locale = useLocale();
  const { data } = useGetDistrictsQuery();

  const options = (data?.districts ?? []).map((d) => ({
    value: String(d.id),
    label: locale === 'hy' ? d.nameHy : d.nameEn,
  }));

  return (
    <Select
      label={t('district')}
      placeholder={t('allDistricts')}
      data={options}
      value={value != null ? String(value) : null}
      onChange={(v) => onChange(v ? Number(v) : undefined)}
      clearable
      searchable
      error={error}
    />
  );
}
