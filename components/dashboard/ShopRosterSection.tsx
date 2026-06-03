'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Anchor, Button, Group, Loader, NumberInput, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useGetShopBarbersQuery, useAddShopBarberMutation } from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';

export function ShopRosterSection({ shopSlug }: { shopSlug: string }) {
  const t = useTranslations('roster');
  const { data, isLoading } = useGetShopBarbersQuery(shopSlug);
  const [addBarber, { isLoading: adding }] = useAddShopBarberMutation();
  const [name, setName] = useState('');
  const [exp, setExp] = useState<number | ''>('');

  const barbers = data?.barbers ?? [];

  const add = async () => {
    if (name.trim().length < 2) return;
    try {
      await addBarber({
        slug: shopSlug,
        data: { displayName: name.trim(), experienceYears: exp === '' ? undefined : Number(exp) },
      }).unwrap();
      notifications.show({ message: t('added'), color: 'teal' });
      setName('');
      setExp('');
    } catch (e) {
      notifications.show({ message: apiErrorMessage(e), color: 'red' });
    }
  };

  return (
    <Paper withBorder p="lg" radius="md">
      <Title order={3} mb="md">
        {t('heading')}
      </Title>

      {isLoading ? (
        <Loader size="sm" />
      ) : barbers.length === 0 ? (
        <Text c="dimmed" size="sm" mb="md">
          {t('empty')}
        </Text>
      ) : (
        <Stack gap="xs" mb="md">
          {barbers.map((b) => (
            <Group key={b.id} justify="space-between">
              <Text>{b.displayName}</Text>
              <Anchor component={Link} href={`/dashboard/barbers/${b.slug}` as Route} size="sm">
                {t('manage')}
              </Anchor>
            </Group>
          ))}
        </Stack>
      )}

      <Group align="flex-end" gap="sm" wrap="wrap">
        <TextInput
          label={t('addName')}
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 160 }}
        />
        <NumberInput
          label={t('addExperience')}
          min={0}
          max={80}
          value={exp}
          onChange={(v) => setExp(v === '' ? '' : Number(v))}
          w={140}
        />
        <Button onClick={add} loading={adding} disabled={name.trim().length < 2}>
          {t('addButton')}
        </Button>
      </Group>
    </Paper>
  );
}
