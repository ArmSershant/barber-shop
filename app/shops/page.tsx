import { getTranslations } from 'next-intl/server';
import { Container, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { listShops } from '@/lib/queries/shops';
import { ShopCard } from '@/components/discover/ShopCard';
import { ShopSearch } from '@/components/discover/ShopSearch';

export default async function ShopsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const t = await getTranslations('discover');
  const shops = await listShops({ q });

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Title order={2}>{t('shopsTitle')}</Title>
        <ShopSearch initialQuery={q ?? ''} />

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
