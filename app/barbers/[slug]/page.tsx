import type { Metadata } from 'next';
import Link from 'next/link';
import NextImage from 'next/image';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { Anchor, Avatar, Box, Button, Card, Container, Group, Paper, Rating, Stack, Text, Title } from '@mantine/core';
import { IconCalendarPlus, IconRosetteDiscountCheckFilled } from '@tabler/icons-react';
import { getBarberProfile } from '@/lib/queries/barbers';
import { getCurrentUser } from '@/lib/auth/session';
import { getOpenStatus } from '@/lib/open-now';
import { BookingWidget } from '@/components/booking/BookingWidget';
import { PortfolioGrid } from '@/components/profile/PortfolioGrid';
import { StickyBookBar } from '@/components/profile/StickyBookBar';
import { ReviewReply } from '@/components/profile/ReviewReply';
import { AtAGlance } from '@/components/profile/AtAGlance';
import { SectionHeader } from '@/components/profile/SectionHeader';
import { FavoriteButton } from '@/components/FavoriteButton';

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
  // Test barbers are hidden from everyone except admins.
  if (barber.isTest && !viewer?.roles?.includes('admin')) notFound();
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
          className={absoluteImage(barber.coverUrl) ? undefined : 'placeholderStripes'}
          style={{ position: 'relative' }}
        >
          {absoluteImage(barber.coverUrl) && (
            <NextImage
              src={barber.coverUrl!}
              alt=""
              fill
              sizes="(max-width: 62em) 100vw, 768px"
              style={{ objectFit: 'cover' }}
            />
          )}
        </Box>
        <Box px="lg" pb="lg">
          <Group wrap="nowrap" align="flex-end" gap="md" mb="md">
            <Avatar
              src={barber.photoUrl ?? undefined}
              size={96}
              radius="xl"
              color="gold"
              style={{ border: '4px solid var(--surf)', marginTop: -48 }}
            >
              {barber.displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Stack gap={2} pb={4} style={{ flex: 1, minWidth: 0 }}>
              <Group gap={6} wrap="nowrap">
                <Title order={2}>{barber.displayName}</Title>
                {barber.isVerified && (
                  <IconRosetteDiscountCheckFilled size={22} color="var(--gold)" />
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
            <FavoriteButton slug={barber.slug} />
          </Group>

          <AtAGlance
            cells={[
              {
                label: tp('rating'),
                value: barber.ratingCount > 0 ? `★ ${barber.ratingAvg.toFixed(1)}` : '—',
              },
              { label: tp('districtLabel'), value: districtName ?? '—' },
              {
                label: tp('statusLabel'),
                value: (
                  <span style={{ color: openStatus.open ? '#3f7a47' : 'var(--dim)' }}>
                    {openStatus.open
                      ? openStatus.closesAt
                        ? `● ${tp('closesAt', { time: openStatus.closesAt })}`
                        : `● ${tp('openNow')}`
                      : tp('closed')}
                  </span>
                ),
              },
              {
                label: tp('priceLabel'),
                value: priceFrom != null ? `${priceFrom.toLocaleString()} ֏` : '—',
              },
            ]}
          />
        </Box>
      </Paper>

      {barber.bio && <Text mt="lg">{barber.bio}</Text>}

      {barber.portfolioImages.length > 0 && (
        <>
          <SectionHeader>{tp('portfolio')}</SectionHeader>
          <PortfolioGrid images={barber.portfolioImages} alt={barber.displayName} />
        </>
      )}

      <SectionHeader>{t('servicesHeading')}</SectionHeader>
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

      <SectionHeader>{t('hoursHeading')}</SectionHeader>
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
          <BookingWidget
            barberSlug={barber.slug}
            services={barber.services}
            loyalty={barber.loyalty}
            waitlistEnabled={barber.waitlistEnabled}
          />
        </div>
      )}
      {isOwnProfile && (
        <Text c="dimmed" size="sm" mt="xl">
          {tb('ownProfile')}
        </Text>
      )}

      <SectionHeader>{trv('heading')}</SectionHeader>
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
              {r.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.photoUrl}
                  alt=""
                  style={{ marginTop: 8, maxWidth: 160, borderRadius: 8, objectFit: 'cover' }}
                />
              )}
              <ReviewReply reviewId={r.id} reply={r.reply} canReply={isOwnProfile} />
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
