'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { Button, Group, Paper, Select, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useGetDistrictsQuery } from '@/lib/store/api';

export function HeroSearch() {
  const t = useTranslations('home');
  const td = useTranslations('discover');
  const locale = useLocale();
  const router = useRouter();
  const { data } = useGetDistrictsQuery();
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState<string | null>(null);

  const districtOptions = (data?.districts ?? []).map((d) => ({
    value: d.slug,
    label: locale === 'hy' ? d.nameHy : d.nameEn,
  }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const q = query.trim();
    if (q) params.set('q', q);
    if (district) params.set('district', district);
    const qs = params.toString();
    router.push((qs ? `/barbers?${qs}` : '/barbers') as Route);
  };

  return (
    <Paper
      component="form"
      onSubmit={submit}
      withBorder
      radius="lg"
      p="xs"
      shadow="sm"
      maw={620}
      w="100%"
    >
      <Group gap="xs" wrap="nowrap" align="stretch">
        <TextInput
          placeholder={td('searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          variant="unstyled"
          size="md"
          style={{ flex: 1, minWidth: 0, paddingInline: 'var(--mantine-spacing-xs)' }}
          aria-label={td('searchPlaceholder')}
        />
        <Select
          placeholder={td('allDistricts')}
          data={districtOptions}
          value={district}
          onChange={setDistrict}
          searchable
          clearable
          variant="unstyled"
          size="md"
          w={160}
          visibleFrom="xs"
          aria-label={td('district')}
        />
        <Button type="submit" size="md" leftSection={<IconSearch size={18} />}>
          {t('searchButton')}
        </Button>
      </Group>
    </Paper>
  );
}
