'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Group, Loader, Paper, Stack, Switch, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  useGetWorkingHoursQuery,
  useSetWorkingHoursMutation,
  type WorkingHourInterval,
} from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

type DayState = { open: boolean; start: string; end: string };
const DEFAULT_DAY: DayState = { open: false, start: '10:00', end: '19:00' };

function toHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function WorkingHoursSection({ barberSlug }: { barberSlug: string }) {
  const t = useTranslations('hours');
  const { data, isLoading } = useGetWorkingHoursQuery(barberSlug);
  const [setWorkingHours, { isLoading: saving }] = useSetWorkingHoursMutation();
  const [days, setDays] = useState<DayState[]>(() => DAY_KEYS.map(() => ({ ...DEFAULT_DAY })));

  useEffect(() => {
    if (!data) return;
    const next = DAY_KEYS.map(() => ({ ...DEFAULT_DAY }));
    for (const iv of data.intervals) {
      if (iv.weekday >= 0 && iv.weekday <= 6) {
        next[iv.weekday] = { open: true, start: toHHMM(iv.startMinute), end: toHHMM(iv.endMinute) };
      }
    }
    setDays(next);
  }, [data]);

  const update = (index: number, patch: Partial<DayState>) =>
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));

  const onSave = async () => {
    const intervals: WorkingHourInterval[] = days
      .map((d, weekday) => ({ d, weekday }))
      .filter(({ d }) => d.open)
      .map(({ d, weekday }) => ({
        weekday,
        startMinute: toMinutes(d.start),
        endMinute: toMinutes(d.end),
      }));
    try {
      await setWorkingHours({ slug: barberSlug, intervals }).unwrap();
      notifications.show({ message: t('saved'), color: 'teal' });
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
      ) : (
        <Stack gap="sm">
          {DAY_KEYS.map((key, i) => (
            <Group key={key} justify="space-between" wrap="nowrap">
              <Switch
                label={t(`days.${key}`)}
                checked={days[i].open}
                onChange={(e) => update(i, { open: e.currentTarget.checked })}
                styles={{ labelWrapper: { minWidth: 110 } }}
              />
              <Group gap="xs">
                <TextInput
                  type="time"
                  value={days[i].start}
                  disabled={!days[i].open}
                  onChange={(e) => update(i, { start: e.currentTarget.value })}
                  w={120}
                />
                <TextInput
                  type="time"
                  value={days[i].end}
                  disabled={!days[i].open}
                  onChange={(e) => update(i, { end: e.currentTarget.value })}
                  w={120}
                />
              </Group>
            </Group>
          ))}
          <Group justify="flex-end">
            <Button onClick={onSave} loading={saving}>
              {t('save')}
            </Button>
          </Group>
        </Stack>
      )}
    </Paper>
  );
}
