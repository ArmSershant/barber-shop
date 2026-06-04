'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Checkbox, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  useProviderServicesQuery,
  useGetBarberAssignmentsQuery,
  useSetBarberAssignmentsMutation,
  type Service,
} from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';

// Which catalog services this barber performs (owner picks via checkboxes).
export function AssignedServicesSection({ barberSlug }: { barberSlug: string }) {
  const t = useTranslations('roster');
  const tst = useTranslations('serviceTypes');
  const { data: catalog, isLoading: catalogLoading } = useProviderServicesQuery();
  const { data: assigned, isLoading: assignedLoading } = useGetBarberAssignmentsQuery(barberSlug);
  const [save, { isLoading: saving }] = useSetBarberAssignmentsMutation();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (assigned) setSelected(assigned.serviceIds);
  }, [assigned]);

  const services = catalog?.services ?? [];
  const label = (s: Service) => (s.type && s.type !== 'other' ? tst(s.type) : s.name);

  const onSave = async () => {
    try {
      await save({ slug: barberSlug, serviceIds: selected }).unwrap();
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
        {t('assignHint')}
      </Text>

      {catalogLoading || assignedLoading ? (
        <Loader size="sm" />
      ) : services.length === 0 ? (
        <Text c="dimmed" size="sm">
          {t('assignEmpty')}
        </Text>
      ) : (
        <Stack gap="xs">
          <Checkbox.Group value={selected} onChange={setSelected}>
            <Stack gap="xs">
              {services.map((s) => (
                <Checkbox
                  key={s.id}
                  value={s.id}
                  label={`${label(s)} · ${s.durationMin} min · ${s.priceAmd.toLocaleString()} ֏`}
                />
              ))}
            </Stack>
          </Checkbox.Group>
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
