'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Select } from '@mantine/core';
import { IconArrowsSort } from '@tabler/icons-react';

/** Sort control for the barbers list. Updates ?sort= preserving other params. */
export function SortSelect() {
  const t = useTranslations('discover');
  const router = useRouter();
  const params = useSearchParams();
  const value = params.get('sort') === 'new' ? 'new' : 'top';

  const onChange = (next: string | null) => {
    const p = new URLSearchParams(params.toString());
    if (next && next !== 'top') p.set('sort', next);
    else p.delete('sort');
    const qs = p.toString();
    router.push(`/barbers${qs ? `?${qs}` : ''}` as Route);
  };

  return (
    <Select
      data={[
        { value: 'top', label: t('sortTop') },
        { value: 'new', label: t('sortNew') },
      ]}
      value={value}
      onChange={onChange}
      leftSection={<IconArrowsSort size={15} />}
      w={180}
      allowDeselect={false}
      aria-label={t('sortLabel')}
    />
  );
}
