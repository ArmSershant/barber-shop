'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { TextInput } from '@mantine/core';

export function ShopSearch({ initialQuery }: { initialQuery: string }) {
  const t = useTranslations('discover');
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    router.push((q ? `/shops?q=${encodeURIComponent(q)}` : '/shops') as Route);
  };

  return (
    <form onSubmit={submit}>
      <TextInput
        placeholder={t('searchShopsPlaceholder')}
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
      />
    </form>
  );
}
