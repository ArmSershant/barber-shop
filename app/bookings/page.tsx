'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Modal,
  Paper,
  Rating,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useLocale } from 'next-intl';
import { Select } from '@mantine/core';
import {
  useMeQuery,
  useGetMyBookingsQuery,
  useCancelBookingMutation,
  useCreateReviewMutation,
  useGetDistrictsQuery,
  useUpdateMeMutation,
  type MyBooking,
} from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';

const STATUS_KEY: Record<string, string> = {
  confirmed: 'statusConfirmed',
  requested: 'statusRequested',
  completed: 'statusCompleted',
  cancelled: 'statusCancelled',
  no_show: 'statusNoShow',
};
const STATUS_COLOR: Record<string, string> = {
  confirmed: 'teal',
  requested: 'yellow',
  completed: 'blue',
  cancelled: 'gray',
  no_show: 'red',
};

export default function MyBookingsPage() {
  const t = useTranslations('myBookings');
  const td = useTranslations('dashboard');
  const ta = useTranslations('availability');
  const tst = useTranslations('serviceTypes');
  const svcLabel = (s: { type: string | null; name: string }) =>
    s.type && s.type !== 'other' ? tst(s.type) : s.name;
  const tr = useTranslations('reviews');
  const locale = useLocale();
  const { data: me, isLoading: meLoading } = useMeQuery();
  const { data: districtsData } = useGetDistrictsQuery();
  const [updateMe, { isLoading: savingArea }] = useUpdateMeMutation();

  const districtOptions = (districtsData?.districts ?? []).map((d) => ({
    value: String(d.id),
    label: locale === 'hy' ? d.nameHy : d.nameEn,
  }));

  const onAreaChange = async (value: string | null) => {
    try {
      await updateMe({ preferredDistrictId: value ? Number(value) : null }).unwrap();
      notifications.show({ message: t('areaSaved'), color: 'teal' });
    } catch (e) {
      notifications.show({ message: apiErrorMessage(e), color: 'red' });
    }
  };
  const { data, isLoading } = useGetMyBookingsQuery(undefined, { skip: !me?.user });
  const [cancelBooking] = useCancelBookingMutation();
  const [createReview, { isLoading: reviewing }] = useCreateReviewMutation();
  const [reviewFor, setReviewFor] = useState<MyBooking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const submitReview = async () => {
    if (!reviewFor) return;
    try {
      await createReview({
        id: reviewFor.id,
        rating,
        comment: comment.trim() || undefined,
      }).unwrap();
      notifications.show({ message: tr('submitted'), color: 'teal' });
      setReviewFor(null);
      setRating(5);
      setComment('');
    } catch (e) {
      notifications.show({ message: apiErrorMessage(e), color: 'red' });
    }
  };

  if (meLoading) {
    return (
      <Center py={80}>
        <Loader />
      </Center>
    );
  }

  if (!me?.user) {
    return (
      <Container size="sm" py="xl">
        <Alert color="blue">
          {td('loginRequired')} <Anchor component={Link} href="/login">{td('loginLink')}</Anchor>
        </Alert>
      </Container>
    );
  }

  const bookings = data?.bookings ?? [];
  const now = Date.now();
  const isUpcoming = (b: MyBooking) =>
    (b.status === 'confirmed' || b.status === 'requested') &&
    new Date(b.startsAt).getTime() >= now;
  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter((b) => !isUpcoming(b));

  const onCancel = (b: MyBooking) => {
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

  const renderCard = (b: MyBooking, cancellable: boolean) => (
    <Paper key={b.id} withBorder p="md" radius="md" className="hoverLift">
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <div>
          <Text fw={600}>
            {new Date(b.startsAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </Text>
          <Anchor component={Link} href={`/barbers/${b.barber.slug}` as Route} size="sm">
            {b.barber.displayName}
          </Anchor>
          <Text size="sm" c="dimmed">
            {b.services.map(svcLabel).join(', ')} · {b.totalPriceAmd.toLocaleString()} ֏
          </Text>
        </div>
        <Stack gap="xs" align="flex-end">
          <Badge variant="light" color={STATUS_COLOR[b.status] ?? 'gray'}>
            {t(STATUS_KEY[b.status] ?? 'statusConfirmed')}
          </Badge>
          {cancellable && (
            <Button variant="subtle" color="red" size="xs" onClick={() => onCancel(b)}>
              {t('cancel')}
            </Button>
          )}
          {!cancellable && b.status === 'completed' && !b.reviewed && (
            <Button
              variant="light"
              size="xs"
              onClick={() => {
                setReviewFor(b);
                setRating(5);
                setComment('');
              }}
            >
              {tr('leave')}
            </Button>
          )}
        </Stack>
      </Group>
    </Paper>
  );

  return (
    <Container size="sm" py="xl">
      <Stack className="stagger">
        <Title order={2}>{t('title')}</Title>

        <Select
          label={t('myArea')}
          description={t('myAreaHint')}
          placeholder={t('myArea')}
          data={districtOptions}
          value={me.user.preferredDistrictId ? String(me.user.preferredDistrictId) : null}
          onChange={onAreaChange}
          disabled={savingArea}
          clearable
          searchable
          maw={300}
        />

        {isLoading ? (
          <Center py={40}>
            <Loader />
          </Center>
        ) : bookings.length === 0 ? (
          <Stack align="flex-start">
            <Text c="dimmed">{t('empty')}</Text>
            <Button component={Link} href="/barbers" variant="light">
              {t('browse')}
            </Button>
          </Stack>
        ) : (
          <>
            <Title order={4}>{t('upcoming')}</Title>
            {upcoming.length === 0 ? (
              <Text c="dimmed" size="sm">
                {t('empty')}
              </Text>
            ) : (
              upcoming.map((b) => renderCard(b, true))
            )}

            {past.length > 0 && (
              <>
                <Title order={4} mt="md">
                  {t('past')}
                </Title>
                {past.map((b) => renderCard(b, false))}
              </>
            )}
          </>
        )}
      </Stack>

      <Modal opened={!!reviewFor} onClose={() => setReviewFor(null)} title={tr('title')} centered>
        <Stack>
          <Rating value={rating} onChange={setRating} size="lg" />
          <Textarea
            label={tr('comment')}
            value={comment}
            onChange={(e) => setComment(e.currentTarget.value)}
            autosize
            minRows={2}
          />
          <Button onClick={submitReview} loading={reviewing}>
            {tr('submit')}
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
}
