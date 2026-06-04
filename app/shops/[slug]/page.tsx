import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { Anchor, Avatar, Card, Container, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { getShopProfile } from '@/lib/queries/shops';
import { BarberCard } from '@/components/discover/BarberCard';

export default async function ShopProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getShopProfile(slug);
  if (!shop) notFound();

  const locale = await getLocale();
  const t = await getTranslations('discover');
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

  return (
    <Container size="md" py="xl">
      <Group wrap="nowrap">
        <Avatar src={shop.logoUrl ?? undefined} size="xl" radius="md" color="teal">
          {shop.name.charAt(0).toUpperCase()}
        </Avatar>
        <Stack gap={4}>
          <Title order={2}>{shop.name}</Title>
          <Text c="dimmed" size="sm">
            {[districtName, shop.address].filter(Boolean).join(' · ')}
          </Text>
          <Group gap="md">
            {shop.phone && (
              <Anchor href={`tel:${shop.phone}`} size="sm">
                {shop.phone}
              </Anchor>
            )}
            {instagramHandle && (
              <Anchor href={`https://instagram.com/${instagramHandle}`} target="_blank" size="sm">
                Instagram
              </Anchor>
            )}
          </Group>
        </Stack>
      </Group>

      {shop.description && <Text mt="lg">{shop.description}</Text>}

      <Title order={3} mt="xl" mb="sm">
        {t('barbersTitle')}
      </Title>
      {shop.barbers.length === 0 ? (
        <Text c="dimmed" size="sm">
          {t('empty')}
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {shop.barbers.map((b) => (
            <BarberCard
              key={b.id}
              barber={{ ...b, shop: { slug: shop.slug, name: shop.name }, district: shop.district }}
            />
          ))}
        </SimpleGrid>
      )}

      <Title order={3} mt="xl" mb="sm">
        {t('servicesHeading')}
      </Title>
      {shop.services.length === 0 ? (
        <Text c="dimmed" size="sm">
          {t('noServices')}
        </Text>
      ) : (
        <>
          <Stack gap="xs">
            {shop.services.map((s) => (
              <Card key={s.id} withBorder radius="md" padding="sm">
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
