'use client';

import { useTranslations } from 'next-intl';
import { Group, Paper, Progress, SimpleGrid, Stack, Text, Title, Tooltip } from '@mantine/core';
import { useGetProviderAnalyticsQuery } from '@/lib/store/api';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Paper withBorder p="md" radius="md">
      <Text fz={26} fw={700}>
        {value}
      </Text>
      <Text c="dimmed" size="sm">
        {label}
      </Text>
    </Paper>
  );
}

export function AnalyticsSection() {
  const t = useTranslations('analytics');
  const th = useTranslations('hours');
  const { data, isLoading } = useGetProviderAnalyticsQuery();

  if (isLoading || !data) return null;

  const amd = (n: number) => `${n.toLocaleString()} ֏`;
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const maxDay = Math.max(1, ...data.byWeekday);

  return (
    <Paper withBorder p="lg" radius="md">
      <Title order={3} mb="md">
        {t('heading')}
      </Title>

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
        <Stat label={t('revenue')} value={amd(data.revenueAmd)} />
        <Stat label={t('revenue30')} value={amd(data.last30.revenueAmd)} />
        <Stat label={t('upcoming')} value={String(data.totals.upcoming)} />
        <Stat label={t('completed')} value={String(data.totals.completed)} />
        <Stat label={t('bookings30')} value={String(data.last30.bookings)} />
        <Stat label={t('repeat')} value={String(data.repeatCustomers)} />
        <Stat label={t('completionRate')} value={pct(data.completionRate)} />
        <Stat label={t('noShowRate')} value={pct(data.noShowRate)} />
      </SimpleGrid>

      <Title order={5} mt="lg" mb="xs">
        {t('byWeekday')}
      </Title>
      <Stack gap={6}>
        {DAY_KEYS.map((key, i) => (
          <Group key={key} gap="sm" wrap="nowrap">
            <Text size="sm" w={96} style={{ flexShrink: 0, whiteSpace: 'nowrap' }} truncate>
              {th(`days.${key}`)}
            </Text>
            <Tooltip label={data.byWeekday[i]} withinPortal>
              <Progress value={(data.byWeekday[i] / maxDay) * 100} style={{ flex: 1 }} size="lg" radius="sm" />
            </Tooltip>
            <Text size="sm" w={24} ta="right" c="dimmed" style={{ flexShrink: 0 }}>
              {data.byWeekday[i]}
            </Text>
          </Group>
        ))}
      </Stack>
    </Paper>
  );
}
