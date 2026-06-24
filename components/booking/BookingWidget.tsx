'use client';

import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import {
  Alert,
  Anchor,
  Box,
  Button,
  Checkbox,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';

const headerBar = {
  background: 'var(--cta-head-bg)',
  color: 'var(--cta-head-fg)',
  padding: '0.7rem 1.25rem',
} as const;
import { DatePickerInput } from '@mantine/dates';
import {
  useMeQuery,
  useGetAvailabilityQuery,
  useCreateBookingMutation,
} from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';

export interface WidgetService {
  id: string;
  type?: string | null;
  name: string;
  durationMin: number;
  priceAmd: number;
}

export function BookingWidget({
  barberSlug,
  services,
}: {
  barberSlug: string;
  services: WidgetService[];
}) {
  const t = useTranslations('booking');
  const tst = useTranslations('serviceTypes');
  const serviceLabel = (s: WidgetService) => (s.type && s.type !== 'other' ? tst(s.type) : s.name);
  const { data: me } = useMeQuery();
  const [createBooking, { isLoading: booking }] = useCreateBookingMutation();

  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ when: string; manageToken: string | null } | null>(null);

  const dateStr = date ? dayjs(date).format('YYYY-MM-DD') : '';
  const ready = serviceIds.length > 0 && Boolean(dateStr);

  const { data: availability, isFetching } = useGetAvailabilityQuery(
    { slug: barberSlug, date: dateStr, serviceIds },
    { skip: !ready },
  );

  const total = useMemo(() => {
    const chosen = services.filter((s) => serviceIds.includes(s.id));
    return {
      price: chosen.reduce((sum, s) => sum + s.priceAmd, 0),
      duration: chosen.reduce((sum, s) => sum + s.durationMin, 0),
    };
  }, [services, serviceIds]);

  const isGuest = !me?.user;

  const fmtSlot = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const onBook = async () => {
    if (!slot) return;
    setError(null);
    try {
      const res = await createBooking({
        slug: barberSlug,
        serviceIds,
        startsAt: slot,
        guest: isGuest ? { name, phone, email: email || undefined } : undefined,
      }).unwrap();
      setConfirmed({
        when: new Date(res.booking.startsAt).toLocaleString(),
        manageToken: res.manageToken,
      });
      setSlot(null);
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  const reset = () => {
    setConfirmed(null);
    setServiceIds([]);
    setDate(null);
    setSlot(null);
    setName('');
    setPhone('');
    setEmail('');
  };

  if (confirmed) {
    return (
      <Paper withBorder p="lg" radius="md">
        <Alert color="teal" title={t('confirmedTitle')}>
          <Stack gap="xs">
            <Text>{t('confirmedBody', { when: confirmed.when })}</Text>
            {confirmed.manageToken && (
              <>
                <Text size="sm" c="dimmed">
                  {t('guestManageNote')}
                </Text>
                <Anchor href={`/manage?token=${encodeURIComponent(confirmed.manageToken)}`} size="sm">
                  {t('manageLink')}
                </Anchor>
              </>
            )}
            <Button variant="light" onClick={reset} mt="sm">
              {t('bookAnother')}
            </Button>
          </Stack>
        </Alert>
      </Paper>
    );
  }

  const canBook = Boolean(slot) && (!isGuest || (name.trim() && phone.trim()));

  return (
    <Paper withBorder p={0} radius="xs" className="offsetShadow" style={{ overflow: 'hidden' }}>
      <Box style={headerBar}>
        <Title order={3} c="inherit" style={{ fontSize: '1.45rem', margin: 0 }}>
          {t('heading')}
        </Title>
      </Box>
      <Stack p="lg">
        {services.length > 0 && (
          <Checkbox.Group label={t('selectServices')} value={serviceIds} onChange={(v) => { setServiceIds(v); setSlot(null); }}>
            <Stack gap="xs" mt="xs">
              {services.map((s) => (
                <Checkbox
                  key={s.id}
                  value={s.id}
                  label={`${serviceLabel(s)} · ${s.durationMin} min · ${s.priceAmd.toLocaleString()} ֏`}
                />
              ))}
            </Stack>
          </Checkbox.Group>
        )}

        <DatePickerInput
          label={t('pickDate')}
          value={date}
          onChange={(d) => { setDate(d); setSlot(null); }}
          minDate={new Date()}
          maxDate={dayjs().add(60, 'day').toDate()}
          valueFormat="DD MMM YYYY"
          clearable
        />

        {ready && (
          <div>
            <Text size="sm" fw={500} mb={6}>
              {t('pickTime')}
            </Text>
            {isFetching ? (
              <Loader size="sm" />
            ) : (availability?.slots.length ?? 0) === 0 ? (
              <Text c="dimmed" size="sm">
                {t('noSlots')}
              </Text>
            ) : (
              <Group gap="xs">
                {availability!.slots.map((s) => (
                  <Button
                    key={s}
                    size="xs"
                    variant={slot === s ? 'filled' : 'default'}
                    onClick={() => setSlot(s)}
                  >
                    {fmtSlot(s)}
                  </Button>
                ))}
              </Group>
            )}
          </div>
        )}

        {slot && isGuest && (
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              {t('guestHint')}
            </Text>
            <TextInput label={t('yourName')} value={name} onChange={(e) => setName(e.currentTarget.value)} required />
            <TextInput label={t('yourPhone')} value={phone} onChange={(e) => setPhone(e.currentTarget.value)} required />
            <TextInput label={t('yourEmail')} value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
          </Stack>
        )}

        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}

        {serviceIds.length > 0 && (
          <Stack gap={6} mt="xs">
            <Group justify="space-between" align="center">
              <Text fw={700} ff="var(--font-display), Georgia, serif" fz="1.35rem">
                {t('total')}: {total.price.toLocaleString()} ֏ · {total.duration} min
              </Text>
              <Button color="ox" size="md" onClick={onBook} loading={booking} disabled={!canBook}>
                {t('book')}
              </Button>
            </Group>
            <Text size="xs" c="dimmed" ta="right">
              {t('reassure')}
            </Text>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
