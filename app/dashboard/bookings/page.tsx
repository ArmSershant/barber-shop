'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Anchor,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { StatusPill } from '@/components/StatusPill';
import { BookingRow } from '@/components/dashboard/BookingRow';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  useGetProviderBookingsQuery,
  useCancelBookingMutation,
  useCompleteBookingMutation,
  useNoShowBookingMutation,
  type ProviderBooking,
} from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';

export default function ProviderBookingsPage() {
  const t = useTranslations('providerBookings');
  const td = useTranslations('dashboard');
  const ta = useTranslations('availability');
  const tst = useTranslations('serviceTypes');
  const svcLabel = (s: { type: string | null; name: string }) =>
    s.type && s.type !== 'other' ? tst(s.type) : s.name;
  const { data, isLoading } = useGetProviderBookingsQuery();
  const [cancelBooking] = useCancelBookingMutation();
  const [completeBooking] = useCompleteBookingMutation();
  const [noShowBooking] = useNoShowBookingMutation();
  const bookings = data?.bookings ?? [];

  const [barber, setBarber] = useState<string>('all');
  const [range, setRange] = useState<string>('all');

  const barberNames = useMemo(
    () => Array.from(new Set(bookings.map((b) => b.barberName))).sort(),
    [bookings],
  );

  const weekFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const visible = bookings.filter((b) => {
    if (barber !== 'all' && b.barberName !== barber) return false;
    if (range === 'week' && new Date(b.startsAt).getTime() > weekFromNow) return false;
    return true;
  });

  const statusLabel = (s: string) =>
    s === 'confirmed'
      ? t('statusConfirmed')
      : s === 'completed'
        ? t('statusCompleted')
        : s === 'cancelled'
          ? t('statusCancelled')
          : s === 'no_show'
            ? t('statusNoShow')
            : t('statusRequested');

  const onComplete = async (id: string) => {
    try {
      await completeBooking(id).unwrap();
      notifications.show({ message: t('completedMsg'), color: 'teal' });
    } catch (e) {
      notifications.show({ message: apiErrorMessage(e), color: 'red' });
    }
  };

  const onNoShow = async (id: string) => {
    try {
      await noShowBooking(id).unwrap();
      notifications.show({ message: t('noShowMsg'), color: 'teal' });
    } catch (e) {
      notifications.show({ message: apiErrorMessage(e), color: 'red' });
    }
  };

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

  const rowActions = (b: ProviderBooking) => {
    const started = new Date(b.startsAt).getTime() <= Date.now();
    const active = b.status === 'confirmed' || b.status === 'requested';
    return (
      <Group gap="xs" wrap="nowrap" align="center">
        <StatusPill status={b.status} label={statusLabel(b.status)} />
        {active && started && (
          <>
            <Button size="xs" variant="default" onClick={() => onComplete(b.id)}>
              {t('complete')}
            </Button>
            <Button size="xs" variant="default" onClick={() => onNoShow(b.id)}>
              {t('noShow')}
            </Button>
          </>
        )}
        {active && (
          <Button size="xs" variant="subtle" color="ox" onClick={() => onCancel(b)}>
            {t('cancel')}
          </Button>
        )}
      </Group>
    );
  };

  return (
    <Container size="md" py="xl">
      <Stack className="stagger">
        <Anchor component={Link} href="/dashboard" size="sm" c="dimmed">
          <IconArrowLeft size={14} style={{ verticalAlign: '-2px' }} /> {td('title')}
        </Anchor>

        <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
          <Title order={2} ff="var(--font-display), Georgia, serif">
            {t('title')}
          </Title>
          <Group gap="sm" wrap="nowrap">
            {barberNames.length > 1 && (
              <Select
                size="xs"
                w={160}
                value={barber}
                onChange={(v) => setBarber(v ?? 'all')}
                data={[{ value: 'all', label: t('allBarbers') }, ...barberNames.map((n) => ({ value: n, label: n }))]}
                allowDeselect={false}
              />
            )}
            <Select
              size="xs"
              w={140}
              value={range}
              onChange={(v) => setRange(v ?? 'all')}
              data={[
                { value: 'all', label: t('rangeAll') },
                { value: 'week', label: t('rangeWeek') },
              ]}
              allowDeselect={false}
            />
          </Group>
        </Group>

        {isLoading ? (
          <Center py={40}>
            <Loader />
          </Center>
        ) : visible.length === 0 ? (
          <Text c="dimmed">{t('empty')}</Text>
        ) : (
          visible.map((b) => (
            <BookingRow
              key={b.id}
              date={new Date(b.startsAt)}
              title={b.customerName + (b.phone ? ` · ${b.phone}` : '')}
              subtitle={`${b.barberName} · ${b.services.map(svcLabel).join(', ')} · ${b.totalPriceAmd.toLocaleString()} ֏`}
              right={rowActions(b)}
              highlight={b.status === 'requested'}
            />
          ))
        )}
      </Stack>
    </Container>
  );
}
