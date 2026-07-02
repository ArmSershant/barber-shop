'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Badge, Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { IconGift } from '@tabler/icons-react';
import { useMyPointsQuery, type PointsReason } from '@/lib/store/api';

const REASON_KEY: Record<PointsReason, string> = {
  earned: 'reasonEarned',
  redeemed: 'reasonRedeemed',
  expired: 'reasonExpired',
  adjustment: 'reasonAdjustment',
};

export function PointsCard() {
  const t = useTranslations('account');
  const locale = useLocale();
  const { data } = useMyPointsQuery();

  const balances = data?.balances ?? [];
  const history = data?.history ?? [];
  const hasAny = balances.length > 0;

  return (
    <Paper withBorder p="xl" radius="xs">
      <Stack gap="md">
        <Group gap="xs" wrap="nowrap">
          <IconGift size={20} color="var(--gold)" />
          <Title order={3} fs="italic" ff="var(--font-display), Georgia, serif">
            {t('pointsTitle')}
          </Title>
        </Group>

        <Text size="sm" c="dimmed">
          {t('pointsHint')}
        </Text>

        {hasAny ? (
          <Stack gap="xs">
            {balances.map((b) => (
              <Group key={`${b.kind}-${b.slug}`} justify="space-between" wrap="nowrap">
                <Text size="sm" truncate>
                  {b.name}
                </Text>
                <Group gap={4} wrap="nowrap" align="baseline">
                  <Text fw={700} ff="var(--font-display), Georgia, serif" style={{ fontSize: '1.3rem' }}>
                    {b.balance.toLocaleString()}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t('pointsUnit')}
                  </Text>
                </Group>
              </Group>
            ))}
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">
            {t('pointsEmpty')}
          </Text>
        )}

        {history.length > 0 && (
          <>
            <Divider label={t('pointsHistory')} labelPosition="left" />
            <Stack gap="xs">
              {history.map((e) => {
                const label = t(REASON_KEY[e.reason]);
                const detail = e.providerName
                  ? `${label} · ${t('pointsFrom', { name: e.providerName })}`
                  : label;
                const date = new Date(e.createdAt).toLocaleDateString(locale, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                return (
                  <Group key={e.id} justify="space-between" wrap="nowrap">
                    <div style={{ minWidth: 0 }}>
                      <Text size="sm" truncate>
                        {detail}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {date}
                      </Text>
                    </div>
                    <Badge color={e.delta >= 0 ? 'teal' : 'ox'} variant="light" radius="sm">
                      {e.delta >= 0 ? `+${e.delta}` : e.delta}
                    </Badge>
                  </Group>
                );
              })}
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
}
