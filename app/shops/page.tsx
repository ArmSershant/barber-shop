import { getLocale, getTranslations } from 'next-intl/server';
import { Container, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconBuildingStore } from '@tabler/icons-react';
import { EmptyState } from '@/components/EmptyState';
import { listShops } from '@/lib/queries/shops';
import { getPreferredDistrict } from '@/lib/queries/districts';
import { getCurrentUser } from '@/lib/auth/session';
import { ShopCard } from '@/components/discover/ShopCard';
import { ShopSearch } from '@/components/discover/ShopSearch';
import { DistrictFilter } from '@/components/discover/DistrictFilter';

export default async function ShopsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; district?: string }>;
}) {
  const { q, district } = await searchParams;
  const t = await getTranslations('discover');
  const locale = await getLocale();

  const viewer = await getCurrentUser();
  const pref = viewer ? await getPreferredDistrict(viewer.userId) : null;
  const shops = await listShops({ q, district, preferredDistrictId: district ? undefined : pref?.id });
  const showHint = pref && !district && shops.length > 0;

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Title order={2}>{t('shopsTitle')}</Title>
        <Group align="flex-end" wrap="wrap">
          <div style={{ flex: 1, minWidth: 200 }}>
            <ShopSearch initialQuery={q ?? ''} />
          </div>
          <DistrictFilter basePath="/shops" q={q ?? ''} value={district ?? ''} />
        </Group>
        {showHint && (
          <Text size="sm" c="dimmed">
            {t('showingFirst', { district: locale === 'hy' ? pref!.nameHy : pref!.nameEn })}
          </Text>
        )}

        {shops.length === 0 ? (
          <EmptyState icon={<IconBuildingStore size={30} />} title={t('emptyShops')} />
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}
