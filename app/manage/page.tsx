'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useGetManagedBookingQuery, useCancelBookingMutation } from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';

const STATUS_KEY: Record<string, string> = {
  confirmed: 'statusConfirmed',
  cancelled: 'statusCancelled',
  completed: 'statusCompleted',
  no_show: 'statusNoShow',
};
const STATUS_COLOR: Record<string, string> = {
  confirmed: 'teal',
  cancelled: 'gray',
  completed: 'blue',
  no_show: 'red',
};

export default function ManageBookingPage() {
  const t = useTranslations('manage');
  const tst = useTranslations('serviceTypes');
  const token = useSearchParams().get('token') ?? '';
  const { data, isLoading, isError } = useGetManagedBookingQuery(token, { skip: !token });
  const [cancelBooking] = useCancelBookingMutation();

  const svcLabel = (s: { type: string | null; name: string }) =>
    s.type && s.type !== 'other' ? tst(s.type) : s.name;

  if (isLoading) {
    return (
      <Center py={80}>
        <Loader />
      </Center>
    );
  }

  const booking = data?.booking ?? null;
  if (!token || isError || !booking) {
    return (
      <Container size="sm" py="xl">
        <Alert color="red">{t('notFound')}</Alert>
      </Container>
    );
  }

  const onCancel = () => {
    modals.openConfirmModal({
      title: t('cancel'),
      centered: true,
      children: <Text size="sm">{t('cancelConfirm')}</Text>,
      labels: { confirm: t('cancel'), cancel: t('cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await cancelBooking({ id: booking.id, token }).unwrap();
          notifications.show({ message: t('cancelled'), color: 'teal' });
        } catch (e) {
          notifications.show({ message: apiErrorMessage(e), color: 'red' });
        }
      },
    });
  };

  const cancellable = booking.status === 'confirmed' && new Date(booking.startsAt) > new Date();

  return (
    <Container size="sm" py="xl">
      <Stack>
        <Title order={2}>{t('title')}</Title>
        <Card withBorder radius="md" padding="lg">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text fw={600}>
                {new Date(booking.startsAt).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </Text>
              <Text size="sm">{booking.barber.displayName}</Text>
              <Text size="sm" c="dimmed">
                {booking.services.map(svcLabel).join(', ')} · {booking.totalPriceAmd.toLocaleString()} ֏
              </Text>
            </div>
            <Badge variant="light" color={STATUS_COLOR[booking.status] ?? 'gray'}>
              {t(STATUS_KEY[booking.status] ?? 'statusConfirmed')}
            </Badge>
          </Group>
          {cancellable && (
            <Button variant="light" color="red" mt="md" onClick={onCancel}>
              {t('cancel')}
            </Button>
          )}
        </Card>
      </Stack>
    </Container>
  );
}
