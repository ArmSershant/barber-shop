import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { Anchor, Avatar, Badge, Box, Button, Card, Container, Group, Paper, Rating, Stack, Text, Title } from '@mantine/core';
import { IconCalendarPlus, IconStarFilled, IconMapPin, IconClock, IconRosetteDiscountCheckFilled } from '@tabler/icons-react';
import { getBarberProfile } from '@/lib/queries/barbers';
import { getCurrentUser } from '@/lib/auth/session';
import { getOpenStatus } from '@/lib/open-now';
import { BookingWidget } from '@/components/booking/BookingWidget';
import { PortfolioGrid } from '@/components/profile/PortfolioGrid';
import { StickyBookBar } from '@/components/profile/StickyBookBar';

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

  const locale = await getLocale();
  const t = await getTranslations('discover');
  const tp = await getTranslations('profile');
  const th = await getTranslations('hours');
  const ts = await getTranslations('services');
  const tst = await getTranslations('serviceTypes');
  const trv = await getTranslations('reviews');
  const tb = await getTranslations('booking');
  const serviceLabel = (s: { type: string | null; name: string }) =>
    s.type && s.type !== 'other' ? tst(s.type) : s.name;

  const districtName = barber.district
    ? locale === 'hy'
      ? barber.district.nameHy
      : barber.district.nameEn
    : null;
  const openStatus = getOpenStatus(barber.workingHours);
  const priceFrom = barber.services.length
    ? Math.min(...barber.services.map((s) => s.priceAmd))
    : null;
  const bookable = barber.services.length > 0 && !isOwnProfile;

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
      <Paper withBorder radius="lg" style={{ overflow: 'hidden' }}>
        <Box
          h={120}
          style={{
            backgroundImage: absoluteImage(barber.coverUrl)
              ? `url(${barber.coverUrl})`
              : 'linear-gradient(135deg, var(--mantine-color-brand-7), var(--mantine-color-brand-5))',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <Box px="lg" pb="lg">
          <Group wrap="nowrap" align="flex-end" gap="md" mt={-48} mb="md">
            <Avatar
              src={barber.photoUrl ?? undefined}
              size={96}
              radius="xl"
              color="teal"
              style={{ border: '4px solid var(--mantine-color-body)' }}
            >
              {barber.displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Stack gap={2} pb={4}>
              <Group gap={6} wrap="nowrap">
                <Title order={2}>{barber.displayName}</Title>
                {barber.isVerified && (
                  <IconRosetteDiscountCheckFilled size={22} color="var(--mantine-color-brand-6)" />
                )}
              </Group>
              <Text c="dimmed" size="sm">
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
            </Stack>
          </Group>

          <Group gap="xs">
            {barber.ratingCount > 0 && (
              <Badge
                size="lg"
                radius="sm"
                color="gold"
                variant="light"
                leftSection={<IconStarFilled size={12} />}
              >
                {barber.ratingAvg.toFixed(1)} ({barber.ratingCount})
              </Badge>
            )}
            {districtName && (
              <Badge size="lg" radius="sm" variant="light" color="gray" leftSection={<IconMapPin size={12} />}>
                {districtName}
              </Badge>
            )}
            <Badge
              size="lg"
              radius="sm"
              variant="light"
              color={openStatus.open ? 'teal' : 'gray'}
              leftSection={<IconClock size={12} />}
            >
              {openStatus.open
                ? openStatus.closesAt
                  ? tp('closesAt', { time: openStatus.closesAt })
                  : tp('openNow')
                : tp('closed')}
            </Badge>
            {priceFrom != null && (
              <Badge size="lg" radius="sm" variant="light">
                {tp('from', { price: priceFrom.toLocaleString() })}
              </Badge>
            )}
          </Group>
        </Box>
      </Paper>

      {barber.bio && <Text mt="lg">{barber.bio}</Text>}

      {barber.portfolioImages.length > 0 && (
        <>
          <Title order={3} mt="xl" mb="sm">
            {tp('portfolio')}
          </Title>
          <PortfolioGrid images={barber.portfolioImages} alt={barber.displayName} />
        </>
      )}

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
                <Group gap="sm" wrap="nowrap">
                  <Text fw={600}>{s.priceAmd.toLocaleString()} ֏</Text>
                  {!isOwnProfile && (
                    <Button
                      component="a"
                      href="#book"
                      size="xs"
                      variant="light"
                      leftSection={<IconCalendarPlus size={14} />}
                    >
                      {t('book')}
                    </Button>
                  )}
                </Group>
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

      {bookable && (
        <div id="book" style={{ marginTop: 'var(--mantine-spacing-xl)', scrollMarginTop: '1rem' }}>
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

      {bookable && (
        <StickyBookBar
          priceLabel={priceFrom != null ? tp('from', { price: priceFrom.toLocaleString() }) : undefined}
          bookLabel={tp('book')}
        />
      )}
    </Container>
  );
}
