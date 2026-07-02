'use client';

import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import {
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
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconCheck, IconCalendarPlus, IconGift } from '@tabler/icons-react';
import { buildIcs } from '@/lib/ics';
import { PhoneInput } from '@/components/PhoneInput';

const headerBar = {
  background: 'var(--cta-head-bg)',
  color: 'var(--cta-head-fg)',
  padding: '0.7rem 1.25rem',
} as const;
import { DatePickerInput } from '@mantine/dates';
import {
  useMeQuery,
  useMyPointsQuery,
  useGetAvailabilityQuery,
  useCreateBookingMutation,
  useJoinWaitlistMutation,
} from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';

export interface WidgetService {
  id: string;
  type?: string | null;
  name: string;
  durationMin: number;
  priceAmd: number;
}

export interface WidgetLoyalty {
  enabled: boolean;
  earnRate: number; // points per 100 ֏
  amdPerPoint: number; // ֏ value of one point on redemption
  maxRedeemPct: number; // max % of a booking points can cover
  scopeKind: 'shop' | 'barber';
  scopeSlug: string;
}

export function BookingWidget({
  barberSlug,
  services,
  loyalty,
  waitlistEnabled = false,
}: {
  barberSlug: string;
  services: WidgetService[];
  /** The loyalty program that applies here (shop's or the barber's). */
  loyalty?: WidgetLoyalty;
  /** Whether the provider accepts waitlist sign-ups for full days. */
  waitlistEnabled?: boolean;
}) {
  const t = useTranslations('booking');
  const tst = useTranslations('serviceTypes');
  const serviceLabel = (s: WidgetService) => (s.type && s.type !== 'other' ? tst(s.type) : s.name);
  const { data: me } = useMeQuery();
  const [createBooking, { isLoading: booking }] = useCreateBookingMutation();
  const [joinWaitlist, { isLoading: joiningWaitlist }] = useJoinWaitlistMutation();
  const [waitlisted, setWaitlisted] = useState(false);

  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [usePoints, setUsePoints] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<
    { when: string; manageToken: string | null; pending: boolean; start: string; end: string } | null
  >(null);

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

  // Loyalty points a logged-in customer would earn for this booking, at the
  // provider's rate (points per 100 ֏). 0 when the provider hasn't opted in.
  const loyaltyOn = Boolean(loyalty?.enabled);
  const earnPoints = loyaltyOn ? Math.floor((total.price * loyalty!.earnRate) / 100) : 0;

  // The customer's balance at this provider, and how much they can redeem here.
  const { data: points } = useMyPointsQuery(undefined, { skip: isGuest || !loyaltyOn });
  const balanceHere =
    points?.balances.find((b) => b.kind === loyalty?.scopeKind && b.slug === loyalty?.scopeSlug)?.balance ?? 0;
  const maxDiscount = loyaltyOn ? Math.floor((total.price * loyalty!.maxRedeemPct) / 100) : 0;
  const redeemablePoints =
    loyaltyOn && loyalty!.amdPerPoint > 0
      ? Math.min(balanceHere, Math.floor(maxDiscount / loyalty!.amdPerPoint))
      : 0;
  const discountAmd = usePoints ? redeemablePoints * (loyalty?.amdPerPoint ?? 0) : 0;
  const finalPrice = total.price - discountAmd;
  const canRedeem = !isGuest && redeemablePoints > 0;

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
        guest: isGuest ? { name, phone, email: email.trim() } : undefined,
        redeemPoints: usePoints && canRedeem ? redeemablePoints : undefined,
      }).unwrap();
      setConfirmed({
        when: new Date(res.booking.startsAt).toLocaleString(),
        manageToken: res.manageToken,
        pending: res.booking.status === 'requested',
        start: res.booking.startsAt,
        end: res.booking.endsAt,
      });
      setSlot(null);
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  const onJoinWaitlist = async () => {
    setError(null);
    try {
      await joinWaitlist({ slug: barberSlug, date: dateStr }).unwrap();
      setWaitlisted(true);
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  const downloadIcs = () => {
    if (!confirmed) return;
    const ics = buildIcs({
      uid: `${confirmed.start}@barber-shop.am`,
      start: new Date(confirmed.start),
      end: new Date(confirmed.end),
      summary: t('heading'),
    });
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'booking.ics';
    a.click();
    URL.revokeObjectURL(url);
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
      <Paper withBorder p="xl" radius="xs" className="offsetShadow">
        <Stack align="center" gap="xs" ta="center">
          <ThemeIcon size={56} radius="xl" color="gold" variant="light">
            <IconCheck size={30} />
          </ThemeIcon>
          <Title order={3} ff="var(--font-display), Georgia, serif">
            {t(confirmed.pending ? 'requestedTitle' : 'confirmedTitle')}
          </Title>
          <Text c="dimmed">
            {t(confirmed.pending ? 'requestedBody' : 'confirmedBody', { when: confirmed.when })}
          </Text>
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
          {!confirmed.pending && (
            <Button
              variant="outline"
              color="gold"
              leftSection={<IconCalendarPlus size={16} />}
              onClick={downloadIcs}
              mt="sm"
            >
              {t('addCalendar')}
            </Button>
          )}
          <Button variant="default" onClick={reset} mt="xs">
            {t('bookAnother')}
          </Button>
          {confirmed.manageToken && (
            <Stack gap={4} mt="md" ta="center">
              <Text size="sm" c="dimmed">
                {t('registerNudge')}
              </Text>
              <Button component="a" href="/register" variant="subtle" size="sm">
                {t('registerCta')}
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>
    );
  }

  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  const canBook = Boolean(slot) && (!isGuest || (name.trim() && phone.trim() && emailValid));

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
          onChange={(d) => { setDate(d); setSlot(null); setWaitlisted(false); }}
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
              <Stack gap={8}>
                <Text c="dimmed" size="sm">
                  {t('noSlots')}
                </Text>
                {waitlistEnabled &&
                  !isGuest &&
                  (waitlisted ? (
                    <Text size="sm" c="var(--gold)">
                      {t('waitlistJoined')}
                    </Text>
                  ) : (
                    <Button size="xs" variant="light" onClick={onJoinWaitlist} loading={joiningWaitlist}>
                      {t('waitlistJoin')}
                    </Button>
                  ))}
              </Stack>
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
            <PhoneInput label={t('yourPhone')} value={phone} onChange={setPhone} required />
            <TextInput
              label={t('yourEmail')}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
            />
          </Stack>
        )}

        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}

        {serviceIds.length > 0 && (
          <Stack gap={6} mt="xs">
            {canRedeem && (
              <Checkbox
                checked={usePoints}
                onChange={(e) => setUsePoints(e.currentTarget.checked)}
                label={t('redeemToggle', {
                  points: redeemablePoints,
                  amount: (redeemablePoints * (loyalty?.amdPerPoint ?? 0)).toLocaleString(),
                })}
              />
            )}
            <Group justify="space-between" align="center">
              <Text fw={700} ff="var(--font-display), Georgia, serif" fz="1.35rem">
                {t('total')}: {finalPrice.toLocaleString()} ֏ · {total.duration} min
              </Text>
              <Button color="ox" size="md" onClick={onBook} loading={booking} disabled={!canBook}>
                {t('book')}
              </Button>
            </Group>
            {discountAmd > 0 && (
              <Text size="xs" c="var(--gold)" ta="right">
                {t('redeemApplied', { amount: discountAmd.toLocaleString(), points: redeemablePoints })}
              </Text>
            )}
            <Text size="xs" c="dimmed" ta="right">
              {t('reassure')}
            </Text>
            {!isGuest && earnPoints > 0 && (
              <Group gap={6} justify="flex-end" wrap="nowrap">
                <IconGift size={14} color="var(--gold)" />
                <Text size="xs" c="var(--gold)">
                  {t('earnHint', { points: earnPoints })}
                </Text>
              </Group>
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
