import type { Metadata } from 'next';
import NextImage from 'next/image';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { Anchor, Avatar, Box, Card, Container, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconBrandInstagram, IconPhone, IconRosetteDiscountCheckFilled } from '@tabler/icons-react';
import { getShopProfile } from '@/lib/queries/shops';
import { BarberCard } from '@/components/discover/BarberCard';
import { PortfolioGrid } from '@/components/profile/PortfolioGrid';
import { AtAGlance } from '@/components/profile/AtAGlance';
import { SectionHeader } from '@/components/profile/SectionHeader';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barber-shop.am';

const absoluteImage = (url: string | null | undefined) =>
  url && /^https?:\/\//.test(url) ? url : undefined;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getShopProfile(slug);
  if (!shop) return { title: 'Barbershop not found' };

  const locality = [shop.district?.nameEn, shop.address].filter(Boolean).join(', ');
  const description =
    shop.description?.slice(0, 160) ||
    `${shop.name} — barbershop in ${locality || 'Yerevan'}. View barbers, services and prices, and book your appointment online.`;
  const image = absoluteImage(shop.logoUrl);

  return {
    title: shop.name,
    description,
    alternates: { canonical: `/shops/${slug}` },
    openGraph: {
      type: 'website',
      title: `${shop.name} — Barbershop in Yerevan`,
      description,
      url: `/shops/${slug}`,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ShopProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getShopProfile(slug);
  if (!shop) notFound();

  const locale = await getLocale();
  const t = await getTranslations('discover');
  const tp = await getTranslations('profile');
  const ts = await getTranslations('services');
  const tst = await getTranslations('serviceTypes');
  const serviceLabel = (s: { type: string | null; name: string }) =>
    s.type && s.type !== 'other' ? tst(s.type) : s.name;

  const districtName = shop.district
    ? locale === 'hy'
      ? shop.district.nameHy
      : shop.district.nameEn
    : null;
  const instagramHandle = shop.instagram?.replace(/^@/, '') ?? null;
  const priceFrom = shop.services.length
    ? Math.min(...shop.services.map((s) => s.priceAmd))
    : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HairSalon',
    name: shop.name,
    url: `${siteUrl}/shops/${shop.slug}`,
    ...(absoluteImage(shop.logoUrl) ? { image: absoluteImage(shop.logoUrl) } : {}),
    ...(shop.description ? { description: shop.description } : {}),
    ...(shop.phone ? { telephone: shop.phone } : {}),
    ...(instagramHandle ? { sameAs: [`https://instagram.com/${instagramHandle}`] } : {}),
    address: {
      '@type': 'PostalAddress',
      ...(shop.address ? { streetAddress: shop.address } : {}),
      addressLocality: shop.district?.nameEn ?? 'Yerevan',
      addressRegion: 'Yerevan',
      addressCountry: 'AM',
    },
    areaServed: 'Yerevan',
    ...(shop.services.length > 0
      ? {
          makesOffer: shop.services.map((s) => ({
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
          h={140}
          className={absoluteImage(shop.coverUrl ?? shop.photos[0]?.url) ? undefined : 'placeholderStripes'}
          style={{ position: 'relative' }}
        >
          {absoluteImage(shop.coverUrl ?? shop.photos[0]?.url) && (
            <NextImage
              src={(shop.coverUrl ?? shop.photos[0].url)!}
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
              src={shop.logoUrl ?? undefined}
              size={96}
              radius="md"
              color="gold"
              style={{ border: '4px solid var(--surf)', marginTop: -48 }}
            >
              {shop.name.charAt(0).toUpperCase()}
            </Avatar>
            <Stack gap={2} pb={4}>
              <Group gap={6} wrap="nowrap">
                <Title order={2}>{shop.name}</Title>
                {shop.isVerified && (
                  <IconRosetteDiscountCheckFilled size={22} color="var(--gold)" />
                )}
              </Group>
              <Group gap="md">
                {shop.phone && (
                  <Anchor href={`tel:${shop.phone}`} size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <IconPhone size={14} /> {shop.phone}
                  </Anchor>
                )}
                {instagramHandle && (
                  <Anchor
                    href={`https://instagram.com/${instagramHandle}`}
                    target="_blank"
                    size="sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <IconBrandInstagram size={14} /> Instagram
                  </Anchor>
                )}
              </Group>
            </Stack>
          </Group>

          <AtAGlance
            cells={[
              { label: tp('districtLabel'), value: districtName ?? shop.address ?? '—' },
              { label: t('barbersTitle'), value: String(shop.barbers.length) },
              {
                label: tp('priceLabel'),
                value: priceFrom != null ? `${priceFrom.toLocaleString()} ֏` : '—',
              },
            ]}
          />
        </Box>
      </Paper>

      {shop.description && <Text mt="lg">{shop.description}</Text>}

      {shop.photos.length > 0 && (
        <>
          <SectionHeader>{tp('photos')}</SectionHeader>
          <PortfolioGrid images={shop.photos} alt={shop.name} />
        </>
      )}

      <SectionHeader>{t('barbersTitle')}</SectionHeader>
      {shop.barbers.length === 0 ? (
        <Text c="dimmed" size="sm">
          {t('empty')}
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {shop.barbers.map((b) => (
            <BarberCard
              key={b.id}
              barber={{
                ...b,
                coverUrl: null,
                minPrice: null,
                shop: { slug: shop.slug, name: shop.name },
                district: shop.district,
              }}
            />
          ))}
        </SimpleGrid>
      )}

      <SectionHeader>{t('servicesHeading')}</SectionHeader>
      {shop.services.length === 0 ? (
        <Text c="dimmed" size="sm">
          {t('noServices')}
        </Text>
      ) : (
        <>
          <Stack gap="xs">
            {shop.services.map((s) => (
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
          <Text c="dimmed" size="sm" mt="sm">
            {t('pickBarber')}
          </Text>
        </>
      )}
    </Container>
  );
}
