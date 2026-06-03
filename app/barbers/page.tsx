import { getTranslations } from 'next-intl/server';
import { Container, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { listBarbers } from '@/lib/queries/barbers';
import { BarberCard } from '@/components/discover/BarberCard';
import { BarberSearch } from '@/components/discover/BarberSearch';

export default async function BarbersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const t = await getTranslations('discover');
  const barbers = await listBarbers({ q });

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Title order={2}>{t('barbersTitle')}</Title>
        <BarberSearch initialQuery={q ?? ''} />

        {barbers.length === 0 ? (
          <Text c="dimmed" mt="md">
            {t('empty')}
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {barbers.map((barber) => (
              <BarberCard key={barber.id} barber={barber} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}
