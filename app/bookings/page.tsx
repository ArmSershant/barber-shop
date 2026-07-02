'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import {
  Alert,
  Anchor,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Modal,
  Rating,
  Select,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { IconStarFilled, IconCamera } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useLocale } from 'next-intl';
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
import { ListSkeleton } from '@/components/ListSkeleton';
import { StatusPill } from '@/components/StatusPill';
import { BookingRow } from '@/components/dashboard/BookingRow';
import { SectionHeader } from '@/components/profile/SectionHeader';

const STATUS_KEY: Record<string, string> = {
  confirmed: 'statusConfirmed',
  requested: 'statusRequested',
  completed: 'statusCompleted',
  cancelled: 'statusCancelled',
  no_show: 'statusNoShow',
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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const reviewPhotoInput = useRef<HTMLInputElement>(null);

  const onReviewPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body, credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? 'Upload failed');
      setPhotoUrl(json.url as string);
    } catch (err) {
      notifications.show({ message: err instanceof Error ? err.message : 'Upload failed', color: 'red' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const submitReview = async () => {
    if (!reviewFor) return;
    try {
      await createReview({
        id: reviewFor.id,
        rating,
        comment: comment.trim() || undefined,
        photoUrl: photoUrl ?? undefined,
      }).unwrap();
      notifications.show({ message: tr('submitted'), color: 'teal' });
      setReviewFor(null);
      setRating(5);
      setComment('');
      setPhotoUrl(null);
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

  const renderCard = (b: MyBooking, cancellable: boolean) => {
    const earned = b.pointsEarned;
    return (
    <BookingRow
      key={b.id}
      date={new Date(b.startsAt)}
      title={b.barber.displayName}
      subtitle={
        <>
          {b.services.map(svcLabel).join(', ')} · {b.totalPriceAmd.toLocaleString()} ֏
          {earned > 0 && (
            <Text component="span" c="var(--gold)">
              {' · '}
              {t('pointsEarned', { points: earned })}
            </Text>
          )}
        </>
      }
      highlight={b.status === 'requested'}
      right={
        <Group gap="xs" wrap="nowrap" align="center">
          <StatusPill status={b.status} label={t(STATUS_KEY[b.status] ?? 'statusConfirmed')} />
          {cancellable && (
            <Button variant="outline" color="ox" size="xs" onClick={() => onCancel(b)}>
              {t('cancel')}
            </Button>
          )}
          {!cancellable && b.status === 'completed' && (
            <>
              <Button
                component={Link}
                href={`/barbers/${b.barber.slug}` as Route}
                variant="default"
                size="xs"
              >
                {t('bookAgain')}
              </Button>
              {!b.reviewed && (
                <Button
                  size="xs"
                  color="gold"
                  leftSection={<IconStarFilled size={12} />}
                  onClick={() => {
                    setReviewFor(b);
                    setRating(5);
                    setComment('');
                  }}
                >
                  {t('review')}
                </Button>
              )}
            </>
          )}
        </Group>
      }
    />
    );
  };

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
          <ListSkeleton rows={3} />
        ) : bookings.length === 0 ? (
          <Stack align="flex-start">
            <Text c="dimmed">{t('empty')}</Text>
            <Button component={Link} href="/barbers" variant="light">
              {t('browse')}
            </Button>
          </Stack>
        ) : (
          <>
            <SectionHeader>{t('upcoming')}</SectionHeader>
            {upcoming.length === 0 ? (
              <Text c="dimmed" size="sm">
                {t('empty')}
              </Text>
            ) : (
              upcoming.map((b) => renderCard(b, true))
            )}

            {past.length > 0 && (
              <>
                <SectionHeader>{t('past')}</SectionHeader>
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
          {photoUrl ? (
            <Group gap="sm" align="center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt=""
                style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }}
              />
              <Button variant="subtle" color="ox" size="xs" onClick={() => setPhotoUrl(null)}>
                {tr('photoRemove')}
              </Button>
            </Group>
          ) : (
            <Button
              variant="default"
              size="xs"
              loading={uploadingPhoto}
              leftSection={<IconCamera size={14} />}
              onClick={() => reviewPhotoInput.current?.click()}
            >
              {tr('photoAdd')}
            </Button>
          )}
          <input
            ref={reviewPhotoInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={onReviewPhoto}
          />
          <Button onClick={submitReview} loading={reviewing}>
            {tr('submit')}
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
}
