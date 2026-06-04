'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Anchor, Badge, Button, Center, Container, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  useGetProviderBookingsQuery,
  useCancelBookingMutation,
  type ProviderBooking,
} from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';

export default function ProviderBookingsPage() {
  const t = useTranslations('providerBookings');
  const ta = useTranslations('availability');
  const tr = useTranslations('roster');
  const { data, isLoading } = useGetProviderBookingsQuery();
  const [cancelBooking] = useCancelBookingMutation();
  const bookings = data?.bookings ?? [];

  const onCancel = (b: ProviderBooking) => {
    modals.openConfirmModal({
      title: t('cancel'),
      centered: true,
      children: <Text size="sm">{t('cancelConfirm')}</Text>,
      labels: { confirm: t('cancel'), cancel: ta('cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await cancelBooking({ id: b.id }).unwrap();
          notifications.show({ message: t('cancelled'), color: 'teal' });
        } catch (e) {
          notifications.show({ message: apiErrorMessage(e), color: 'red' });
        }
      },
    });
  };

  return (
    <Container size="sm" py="xl">
      <Stack>
        <Anchor component={Link} href="/dashboard" size="sm">
          ← {tr('back')}
        </Anchor>
        <Title order={2}>{t('title')}</Title>

        {isLoading ? (
          <Center py={40}>
            <Loader />
          </Center>
        ) : bookings.length === 0 ? (
          <Text c="dimmed">{t('empty')}</Text>
        ) : (
          bookings.map((b) => (
            <Paper key={b.id} withBorder p="md" radius="md">
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <div>
                  <Text fw={600}>
                    {new Date(b.startsAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </Text>
                  <Text size="sm">
                    {b.customerName}
                    {b.phone ? ` · ${b.phone}` : ''}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {b.barberName} · {b.services.join(', ')} · {b.totalPriceAmd.toLocaleString()} ֏
                  </Text>
                  {b.note && (
                    <Text size="xs" c="dimmed">
                      “{b.note}”
                    </Text>
                  )}
                </div>
                <Stack gap="xs" align="flex-end">
                  <Badge variant="light" color={b.status === 'confirmed' ? 'teal' : 'yellow'}>
                    {b.status === 'confirmed' ? t('statusConfirmed') : t('statusRequested')}
                  </Badge>
                  <Button variant="subtle" color="red" size="xs" onClick={() => onCancel(b)}>
                    {t('cancel')}
                  </Button>
                </Stack>
              </Group>
            </Paper>
          ))
        )}
      </Stack>
    </Container>
  );
}
