'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge, Button, Group, Loader, Paper, Select, Stack, Text, TextInput, Title } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  useGetBreaksQuery,
  useCreateBreakMutation,
  useDeleteBreakMutation,
  type Break,
} from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function toHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function BreaksSection({ barberSlug }: { barberSlug: string }) {
  const t = useTranslations('availability');
  const th = useTranslations('hours');
  const { data, isLoading } = useGetBreaksQuery(barberSlug);
  const [createBreak, { isLoading: adding }] = useCreateBreakMutation();
  const [deleteBreak] = useDeleteBreakMutation();
  const [day, setDay] = useState<string>('all');
  const [start, setStart] = useState('14:00');
  const [end, setEnd] = useState('15:00');

  const items = data?.breaks ?? [];

  const dayOptions = [
    { value: 'all', label: t('everyDay') },
    ...DAY_KEYS.map((k, i) => ({ value: String(i), label: th(`days.${k}`) })),
  ];
  const dayLabel = (weekday: number | null) =>
    weekday == null ? t('everyDay') : th(`days.${DAY_KEYS[weekday]}`);

  const add = async () => {
    try {
      await createBreak({
        slug: barberSlug,
        data: {
          weekday: day === 'all' ? null : Number(day),
          startMinute: toMinutes(start),
          endMinute: toMinutes(end),
        },
      }).unwrap();
      notifications.show({ message: t('breakAdded'), color: 'teal' });
    } catch (e) {
      notifications.show({ message: apiErrorMessage(e), color: 'red' });
    }
  };

  const remove = (item: Break) => {
    modals.openConfirmModal({
      title: t('breaksHeading'),
      centered: true,
      children: <Text size="sm">{t('deleteConfirm')}</Text>,
      labels: { confirm: t('delete'), cancel: t('cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await deleteBreak({ slug: barberSlug, id: item.id }).unwrap();
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
        {t('breaksHeading')}
      </Title>

      {isLoading ? (
        <Loader size="sm" />
      ) : items.length === 0 ? (
        <Text c="dimmed" size="sm" mb="md">
          {t('breaksEmpty')}
        </Text>
      ) : (
        <Stack gap="xs" mb="md">
          {items.map((item) => (
            <Group key={item.id} justify="space-between" wrap="nowrap">
              <Text size="sm">
                {dayLabel(item.weekday)} · {toHHMM(item.startMinute)}–{toHHMM(item.endMinute)}
              </Text>
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
        <Select
          label={t('day')}
          data={dayOptions}
          value={day}
          onChange={(v) => setDay(v ?? 'all')}
          allowDeselect={false}
          w={150}
        />
        <TextInput type="time" label={t('from')} value={start} onChange={(e) => setStart(e.currentTarget.value)} w={120} />
        <TextInput type="time" label={t('to')} value={end} onChange={(e) => setEnd(e.currentTarget.value)} w={120} />
        <Button onClick={add} loading={adding}>
          {t('addBreak')}
        </Button>
      </Group>
    </Paper>
  );
}
