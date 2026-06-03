'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Group, Loader, Modal, Paper, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useProviderServicesQuery, useDeleteServiceMutation, type Service } from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';
import { ServiceForm } from './ServiceForm';

export function ServicesSection() {
  const t = useTranslations('services');
  const { data, isLoading } = useProviderServicesQuery();
  const [deleteService] = useDeleteServiceMutation();
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const services = data?.services ?? [];

  const openAdd = () => {
    setEditing(null);
    open();
  };
  const openEdit = (service: Service) => {
    setEditing(service);
    open();
  };

  const onDelete = (service: Service) => {
    modals.openConfirmModal({
      title: service.name,
      centered: true,
      children: <Text size="sm">{t('deleteConfirm')}</Text>,
      labels: { confirm: t('delete'), cancel: t('cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await deleteService(service.id).unwrap();
          notifications.show({ message: t('deleted'), color: 'teal' });
        } catch (e) {
          notifications.show({ message: apiErrorMessage(e), color: 'red' });
        }
      },
    });
  };

  return (
    <Paper withBorder p="lg" radius="md">
      <Group justify="space-between" mb="md">
        <Title order={3}>{t('heading')}</Title>
        <Button size="xs" onClick={openAdd}>
          {t('add')}
        </Button>
      </Group>

      {isLoading ? (
        <Loader size="sm" />
      ) : services.length === 0 ? (
        <Text c="dimmed" size="sm">
          {t('empty')}
        </Text>
      ) : (
        <Stack gap="xs">
          {services.map((service) => (
            <Group key={service.id} justify="space-between" wrap="nowrap">
              <div>
                <Text fw={500}>{service.name}</Text>
                <Text c="dimmed" size="sm">
                  {service.durationMin} {t('minShort')} · {service.priceAmd.toLocaleString()} ֏
                </Text>
              </div>
              <Group gap="xs">
                <Button variant="subtle" size="xs" onClick={() => openEdit(service)}>
                  {t('edit')}
                </Button>
                <Button variant="subtle" color="red" size="xs" onClick={() => onDelete(service)}>
                  {t('delete')}
                </Button>
              </Group>
            </Group>
          ))}
        </Stack>
      )}

      <Modal opened={opened} onClose={close} title={editing ? t('modalEdit') : t('modalAdd')} centered>
        <ServiceForm service={editing} onDone={close} />
      </Modal>
    </Paper>
  );
}
