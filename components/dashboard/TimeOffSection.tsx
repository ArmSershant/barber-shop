'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge, Button, Group, Loader, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  useGetTimeOffQuery,
  useCreateTimeOffMutation,
  useDeleteTimeOffMutation,
  type TimeOff,
} from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';

export function TimeOffSection({ barberSlug }: { barberSlug: string }) {
  const t = useTranslations('availability');
  const { data, isLoading } = useGetTimeOffQuery(barberSlug);
  const [createTimeOff, { isLoading: adding }] = useCreateTimeOffMutation();
  const [deleteTimeOff] = useDeleteTimeOffMutation();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');

  const items = data?.timeOff ?? [];
  const fmt = (iso: string) => new Date(iso).toLocaleDateString();

  const add = async () => {
    if (!start || !end) return;
    try {
      await createTimeOff({
        slug: barberSlug,
        data: { startsAt: `${start}T00:00:00`, endsAt: `${end}T23:59:59`, reason: reason || undefined },
      }).unwrap();
      notifications.show({ message: t('timeOffAdded'), color: 'teal' });
      setStart('');
      setEnd('');
      setReason('');
    } catch (e) {
      notifications.show({ message: apiErrorMessage(e), color: 'red' });
    }
  };

  const remove = (item: TimeOff) => {
    modals.openConfirmModal({
      title: t('timeOffHeading'),
      centered: true,
      children: <Text size="sm">{t('deleteConfirm')}</Text>,
      labels: { confirm: t('delete'), cancel: t('cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await deleteTimeOff({ slug: barberSlug, id: item.id }).unwrap();
          notifications.show({ message: t('deleted'), color: 'teal' });
        } catch (e) {
          notifications.show({ message: apiErrorMessage(e), color: 'red' });
        }
      },
    });
  };

  return (
    <Paper withBorder p="lg" radius="md">
      <Title order={3} mb="md">
        {t('timeOffHeading')}
      </Title>

      {isLoading ? (
        <Loader size="sm" />
      ) : items.length === 0 ? (
        <Text c="dimmed" size="sm" mb="md">
          {t('timeOffEmpty')}
        </Text>
      ) : (
        <Stack gap="xs" mb="md">
          {items.map((item) => (
            <Group key={item.id} justify="space-between" wrap="nowrap">
              <div>
                <Text size="sm">
                  {fmt(item.startsAt)} – {fmt(item.endsAt)}
                </Text>
                {item.reason && (
                  <Text size="xs" c="dimmed">
                    {item.reason}
                  </Text>
                )}
              </div>
              <Group gap="xs">
                {item.status === 'pending' && (
                  <Badge color="yellow" variant="light">
                    {t('pending')}
                  </Badge>
                )}
                <Button variant="subtle" color="red" size="xs" onClick={() => remove(item)}>
                  {t('delete')}
                </Button>
              </Group>
            </Group>
          ))}
        </Stack>
      )}

      <Group align="flex-end" gap="sm" wrap="wrap">
        <TextInput
          type="date"
          label={t('startDate')}
          value={start}
          onChange={(e) => setStart(e.currentTarget.value)}
        />
        <TextInput
          type="date"
          label={t('endDate')}
          value={end}
          onChange={(e) => setEnd(e.currentTarget.value)}
        />
        <TextInput
          label={t('reason')}
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 160 }}
        />
        <Button onClick={add} loading={adding} disabled={!start || !end}>
          {t('addTimeOff')}
        </Button>
      </Group>
    </Paper>
  );
}
