'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Checkbox, Group, Loader, NumberInput, Paper, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  useProviderServicesQuery,
  useGetBarberAssignmentsQuery,
  useSetBarberAssignmentsMutation,
  type Service,
  type ServiceAssignment,
} from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';

type RowState = { checked: boolean; price: number | ''; duration: number | '' };

// Which catalog services this barber performs, with optional per-barber
// price/duration overrides (empty = use the catalog values).
export function AssignedServicesSection({ barberSlug }: { barberSlug: string }) {
  const t = useTranslations('roster');
  const tst = useTranslations('serviceTypes');
  const { data: catalog, isLoading: catalogLoading } = useProviderServicesQuery();
  const { data: assigned, isLoading: assignedLoading } = useGetBarberAssignmentsQuery(barberSlug);
  const [save, { isLoading: saving }] = useSetBarberAssignmentsMutation();
  const [rows, setRows] = useState<Record<string, RowState>>({});

  useEffect(() => {
    if (!assigned) return;
    const next: Record<string, RowState> = {};
    for (const a of assigned.assignments) {
      next[a.serviceId] = {
        checked: true,
        price: a.priceAmdOverride ?? '',
        duration: a.durationMinOverride ?? '',
      };
    }
    setRows(next);
  }, [assigned]);

  const services = catalog?.services ?? [];
  const label = (s: Service) => (s.type && s.type !== 'other' ? tst(s.type) : s.name);
  const row = (id: string): RowState => rows[id] ?? { checked: false, price: '', duration: '' };
  const update = (id: string, patch: Partial<RowState>) =>
    setRows((prev) => ({ ...prev, [id]: { ...row(id), ...patch } }));

  const onSave = async () => {
    const assignments: ServiceAssignment[] = services
      .filter((s) => row(s.id).checked)
      .map((s) => {
        const r = row(s.id);
        return {
          serviceId: s.id,
          priceAmdOverride: r.price === '' ? null : Number(r.price),
          durationMinOverride: r.duration === '' ? null : Number(r.duration),
        };
      });
    try {
      await save({ slug: barberSlug, assignments }).unwrap();
      notifications.show({ message: t('assignmentsSaved'), color: 'teal' });
    } catch (e) {
      notifications.show({ message: apiErrorMessage(e), color: 'red' });
    }
  };

  return (
    <Paper withBorder p="lg" radius="md">
      <Title order={3} mb="xs">
        {t('assignHeading')}
      </Title>
      <Text c="dimmed" size="sm" mb="md">
        {t('assignHint')} {t('overrideHint')}
      </Text>

      {catalogLoading || assignedLoading ? (
        <Loader size="sm" />
      ) : services.length === 0 ? (
        <Text c="dimmed" size="sm">
          {t('assignEmpty')}
        </Text>
      ) : (
        <Stack gap="sm">
          {services.map((s) => {
            const r = row(s.id);
            return (
              <Group key={s.id} justify="space-between" wrap="wrap" gap="xs">
                <Checkbox
                  checked={r.checked}
                  onChange={(e) => update(s.id, { checked: e.currentTarget.checked })}
                  label={`${label(s)} · ${s.durationMin} min · ${s.priceAmd.toLocaleString()} ֏`}
                  style={{ flex: 1, minWidth: 220 }}
                />
                {r.checked && (
                  <Group gap="xs">
                    <NumberInput
                      placeholder={String(s.priceAmd)}
                      aria-label={t('overridePrice')}
                      min={0}
                      step={500}
                      value={r.price}
                      onChange={(v) => update(s.id, { price: v === '' ? '' : Number(v) })}
                      w={120}
                      suffix=" ֏"
                    />
                    <NumberInput
                      placeholder={String(s.durationMin)}
                      aria-label={t('overrideDuration')}
                      min={5}
                      max={600}
                      step={5}
                      value={r.duration}
                      onChange={(v) => update(s.id, { duration: v === '' ? '' : Number(v) })}
                      w={100}
                      suffix=" min"
                    />
                  </Group>
                )}
              </Group>
            );
          })}
          <Group justify="flex-end">
            <Button onClick={onSave} loading={saving}>
              {t('assignSave')}
            </Button>
          </Group>
        </Stack>
      )}
    </Paper>
  );
}
