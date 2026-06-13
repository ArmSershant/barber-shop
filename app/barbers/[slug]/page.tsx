import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Anchor, Avatar, Card, Container, Group, Rating, Stack, Text, Title } from '@mantine/core';
import { getBarberProfile } from '@/lib/queries/barbers';
import { getCurrentUser } from '@/lib/auth/session';
import { BookingWidget } from '@/components/booking/BookingWidget';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barber-shop.am';
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const absoluteImage = (url: string | null | undefined) =>
  url && /^https?:\/\//.test(url) ? url : undefined;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const barber = await getBarberProfile(slug);
  if (!barber) return { title: 'Barber not found' };

  const where = barber.shop ? `at ${barber.shop.name}` : 'independent barber';
  const description =
    barber.bio?.slice(0, 160) ||
    `Book ${barber.displayName}, ${where} in Yerevan. View services, prices, working hours and reviews, then book online.`;
  const image = absoluteImage(barber.photoUrl);

  return {
    title: barber.displayName,
    description,
    alternates: { canonical: `/barbers/${slug}` },
    openGraph: {
      type: 'profile',
      title: `${barber.displayName} — Barber in Yerevan`,
      description,
      url: `/barbers/${slug}`,
      images: image ? [image] : undefined,
    },
  };
}

function toHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default async function BarberProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const barber = await getBarberProfile(slug);
  if (!barber) notFound();

  const viewer = await getCurrentUser();
  const isOwnProfile = Boolean(
    viewer &&
      (barber.userId === viewer.userId || barber.shop?.ownerUserId === viewer.userId),
  );

  const t = await getTranslations('discover');
  const th = await getTranslations('hours');
  const ts = await getTranslations('services');
  const tst = await getTranslations('serviceTypes');
  const trv = await getTranslations('reviews');
  const tb = await getTranslations('booking');
  const serviceLabel = (s: { type: string | null; name: string }) =>
    s.type && s.type !== 'other' ? tst(s.type) : s.name;

  // First interval per weekday (single-shift display).
  const hoursByDay = new Map<number, { startMinute: number; endMinute: number }>();
  for (const iv of barber.workingHours) {
    if (!hoursByDay.has(iv.weekday)) hoursByDay.set(iv.weekday, iv);
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HairSalon',
    name: barber.displayName,
    url: `${siteUrl}/barbers/${barber.slug}`,
    ...(absoluteImage(barber.photoUrl) ? { image: absoluteImage(barber.photoUrl) } : {}),
    ...(barber.bio ? { description: barber.bio } : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: barber.district?.nameEn ?? 'Yerevan',
      addressRegion: 'Yerevan',
      addressCountry: 'AM',
    },
    areaServed: 'Yerevan',
    ...(barber.ratingCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(barber.ratingAvg).toFixed(1),
            reviewCount: barber.ratingCount,
          },
        }
      : {}),
    ...(barber.services.length > 0
      ? {
          makesOffer: barber.services.map((s) => ({
            '@type': 'Offer',
            name: s.name,
            priceCurrency: 'AMD',
            price: s.priceAmd,
          })),
        }
      : {}),
  };

  return (
    <Container size="md" py="xl" className="stagger">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
      {barber.services.length === 0 ? (
        <Text c="dimmed" size="sm">
          {t('noServices')}
        </Text>
      ) : (
        <Stack gap="xs">
          {barber.services.map((s) => (
            <Card key={s.id} withBorder radius="md" padding="sm" className="hoverLift">
              <Group justify="space-between" wrap="nowrap">
                <div>
                  <Text fw={500}>{serviceLabel(s)}</Text>
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

      {barber.services.length > 0 && !isOwnProfile && (
        <div style={{ marginTop: 'var(--mantine-spacing-xl)' }}>
          <BookingWidget barberSlug={barber.slug} services={barber.services} />
        </div>
      )}
      {isOwnProfile && (
        <Text c="dimmed" size="sm" mt="xl">
          {tb('ownProfile')}
        </Text>
      )}

      <Title order={3} mt="xl" mb="sm">
        {trv('heading')}
      </Title>
      {barber.reviews.length === 0 ? (
        <Text c="dimmed" size="sm">
          {t('noReviews')}
        </Text>
      ) : (
        <Stack gap="sm">
          {barber.reviews.map((r) => (
            <Card key={r.id} withBorder radius="md" padding="sm">
              <Group justify="space-between">
                <Group gap="xs">
                  <Rating value={r.rating} readOnly size="sm" />
                  <Text size="sm" fw={500}>
                    {r.customer.fullName}
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  {new Date(r.createdAt).toLocaleDateString()}
                </Text>
              </Group>
              {r.comment && (
                <Text size="sm" mt={6}>
                  {r.comment}
                </Text>
              )}
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}
