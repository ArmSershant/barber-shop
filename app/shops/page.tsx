import { getTranslations } from 'next-intl/server';
import { Container, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { listShops } from '@/lib/queries/shops';
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
  const shops = await listShops({ q, district });

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

        {shops.length === 0 ? (
          <Text c="dimmed" mt="md">
            {t('emptyShops')}
          </Text>
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
