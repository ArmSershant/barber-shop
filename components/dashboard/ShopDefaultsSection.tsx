'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Divider, Group, Loader, Paper, Select, Stack, Switch, Text, TextInput, Title } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  useGetShopDefaultsQuery,
  useSetShopDefaultsMutation,
  useApplyShopDefaultsMutation,
  type WorkingHourInterval,
  type BreakRequest,
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

export function ShopDefaultsSection({ shopSlug }: { shopSlug: string }) {
  const t = useTranslations('shopDefaults');
  const th = useTranslations('hours');
  const ta = useTranslations('availability');
  const { data, isLoading } = useGetShopDefaultsQuery(shopSlug);
  const [save, { isLoading: saving }] = useSetShopDefaultsMutation();
  const [applyAll, { isLoading: applying }] = useApplyShopDefaultsMutation();

  const [days, setDays] = useState<DayState[]>(() => DAY_KEYS.map(() => ({ ...DEFAULT_DAY })));
  const [breaks, setBreaks] = useState<BreakRequest[]>([]);
  const [bDay, setBDay] = useState('all');
  const [bStart, setBStart] = useState('14:00');
  const [bEnd, setBEnd] = useState('15:00');

  useEffect(() => {
    if (!data) return;
    const nd = DAY_KEYS.map(() => ({ ...DEFAULT_DAY }));
    for (const iv of data.workingHours) {
      if (iv.weekday >= 0 && iv.weekday <= 6) {
        nd[iv.weekday] = { open: true, start: toHHMM(iv.startMinute), end: toHHMM(iv.endMinute) };
      }
    }
    setDays(nd);
    setBreaks(data.breaks ?? []);
  }, [data]);

  const updateDay = (i: number, patch: Partial<DayState>) =>
    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  const addBreakRow = () =>
    setBreaks((prev) => [
      ...prev,
      { weekday: bDay === 'all' ? null : Number(bDay), startMinute: toMinutes(bStart), endMinute: toMinutes(bEnd) },
    ]);
  const removeBreakRow = (idx: number) => setBreaks((prev) => prev.filter((_, i) => i !== idx));

  const buildHours = (): WorkingHourInterval[] =>
    days
      .map((d, weekday) => ({ d, weekday }))
      .filter(({ d }) => d.open)
      .map(({ d, weekday }) => ({ weekday, startMinute: toMinutes(d.start), endMinute: toMinutes(d.end) }));

  const onSave = async () => {
    try {
      await save({ slug: shopSlug, workingHours: buildHours(), breaks }).unwrap();
      notifications.show({ message: t('saved'), color: 'teal' });
    } catch (e) {
      notifications.show({ message: apiErrorMessage(e), color: 'red' });
    }
  };

  const onApply = () => {
    modals.openConfirmModal({
      title: t('applyAll'),
      centered: true,
      children: <Text size="sm">{t('applyConfirm')}</Text>,
      labels: { confirm: t('applyAll'), cancel: ta('cancel') },
      onConfirm: async () => {
        try {
          await save({ slug: shopSlug, workingHours: buildHours(), breaks }).unwrap();
          await applyAll(shopSlug).unwrap();
          notifications.show({ message: t('applied'), color: 'teal' });
        } catch (e) {
          notifications.show({ message: apiErrorMessage(e), color: 'red' });
        }
      },
    });
  };

  const dayOptions = [
    { value: 'all', label: ta('everyDay') },
    ...DAY_KEYS.map((k, i) => ({ value: String(i), label: th(`days.${k}`) })),
  ];
  const breakDayLabel = (w: number | null) => (w == null ? ta('everyDay') : th(`days.${DAY_KEYS[w]}`));

  return (
    <Paper withBorder p="lg" radius="md">
      <Title order={3} mb="md">
        {t('heading')}
      </Title>

      {isLoading ? (
        <Loader size="sm" />
      ) : (
        <Stack>
          <Text fw={500}>{t('hoursLabel')}</Text>
          <Stack gap="sm">
            {DAY_KEYS.map((key, i) => (
              <Group key={key} justify="space-between" wrap="nowrap">
                <Switch
                  label={th(`days.${key}`)}
                  checked={days[i].open}
                  onChange={(e) => updateDay(i, { open: e.currentTarget.checked })}
                  styles={{ labelWrapper: { minWidth: 110 } }}
                />
                <Group gap="xs">
                  <TextInput type="time" value={days[i].start} disabled={!days[i].open} onChange={(e) => updateDay(i, { start: e.currentTarget.value })} w={120} />
                  <TextInput type="time" value={days[i].end} disabled={!days[i].open} onChange={(e) => updateDay(i, { end: e.currentTarget.value })} w={120} />
                </Group>
              </Group>
            ))}
          </Stack>

          <Divider my="sm" />
          <Text fw={500}>{t('breaksLabel')}</Text>
          {breaks.length > 0 && (
            <Stack gap="xs">
              {breaks.map((b, idx) => (
                <Group key={idx} justify="space-between">
                  <Text size="sm">
                    {breakDayLabel(b.weekday)} · {toHHMM(b.startMinute)}–{toHHMM(b.endMinute)}
                  </Text>
                  <Button variant="subtle" color="red" size="xs" onClick={() => removeBreakRow(idx)}>
                    {ta('delete')}
                  </Button>
                </Group>
              ))}
            </Stack>
          )}
          <Group align="flex-end" gap="sm" wrap="wrap">
            <Select label={ta('day')} data={dayOptions} value={bDay} onChange={(v) => setBDay(v ?? 'all')} allowDeselect={false} w={150} />
            <TextInput type="time" label={ta('from')} value={bStart} onChange={(e) => setBStart(e.currentTarget.value)} w={120} />
            <TextInput type="time" label={ta('to')} value={bEnd} onChange={(e) => setBEnd(e.currentTarget.value)} w={120} />
            <Button variant="default" onClick={addBreakRow}>
              {ta('addBreak')}
            </Button>
          </Group>

          <Group justify="flex-end" mt="md">
            <Button onClick={onSave} loading={saving}>
              {t('save')}
            </Button>
            <Button variant="light" onClick={onApply} loading={applying}>
              {t('applyAll')}
            </Button>
          </Group>
        </Stack>
      )}
    </Paper>
  );
}
