import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Anchor, Avatar, Card, Container, Group, Stack, Text, Title } from '@mantine/core';
import { getBarberProfile } from '@/lib/queries/barbers';
import { BookingWidget } from '@/components/booking/BookingWidget';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

function toHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default async function BarberProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const barber = await getBarberProfile(slug);
  if (!barber) notFound();

  const t = await getTranslations('discover');
  const th = await getTranslations('hours');
  const ts = await getTranslations('services');

  // First interval per weekday (single-shift display).
  const hoursByDay = new Map<number, { startMinute: number; endMinute: number }>();
  for (const iv of barber.workingHours) {
    if (!hoursByDay.has(iv.weekday)) hoursByDay.set(iv.weekday, iv);
  }

  return (
    <Container size="md" py="xl">
      <Group wrap="nowrap">
        <Avatar src={barber.photoUrl ?? undefined} size="xl" radius="xl" color="teal">
          {barber.displayName.charAt(0).toUpperCase()}
        </Avatar>
        <Stack gap={4}>
          <Title order={2}>{barber.displayName}</Title>
          <Text c="dimmed">
            {barber.shop ? (
              <Anchor component={Link} href={`/shops/${barber.shop.slug}` as Route}>
                {barber.shop.name}
              </Anchor>
            ) : (
              t('independent')
            )}
            {barber.experienceYears
              ? ` · ${t('experience', { years: barber.experienceYears })}`
              : ''}
          </Text>
          <Text size="sm" c="dimmed">
            {barber.ratingCount > 0
              ? `★ ${barber.ratingAvg.toFixed(1)} · ${t('reviews', { count: barber.ratingCount })}`
              : t('noReviews')}
          </Text>
        </Stack>
      </Group>

      {barber.bio && <Text mt="lg">{barber.bio}</Text>}

      <Title order={3} mt="xl" mb="sm">
        {t('servicesHeading')}
      </Title>
      {barber.ownedServices.length === 0 ? (
        <Text c="dimmed" size="sm">
          {t('noServices')}
        </Text>
      ) : (
        <Stack gap="xs">
          {barber.ownedServices.map((s) => (
            <Card key={s.id} withBorder radius="md" padding="sm">
              <Group justify="space-between" wrap="nowrap">
                <div>
                  <Text fw={500}>{s.name}</Text>
                  <Text size="sm" c="dimmed">
                    ~{s.durationMin} {ts('minShort')}
                  </Text>
                </div>
                <Text fw={600}>{s.priceAmd.toLocaleString()} ֏</Text>
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      <Title order={3} mt="xl" mb="sm">
        {t('hoursHeading')}
      </Title>
      <Stack gap={4}>
        {DAY_KEYS.map((key, weekday) => {
          const iv = hoursByDay.get(weekday);
          return (
            <Group key={key} justify="space-between" maw={280}>
              <Text size="sm">{th(`days.${key}`)}</Text>
              <Text size="sm" c={iv ? undefined : 'dimmed'}>
                {iv ? `${toHHMM(iv.startMinute)}–${toHHMM(iv.endMinute)}` : t('closed')}
              </Text>
            </Group>
          );
        })}
      </Stack>

      {barber.ownedServices.length > 0 && (
        <div style={{ marginTop: 'var(--mantine-spacing-xl)' }}>
          <BookingWidget barberSlug={barber.slug} services={barber.ownedServices} />
        </div>
      )}
    </Container>
  );
}
