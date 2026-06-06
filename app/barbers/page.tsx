import { getTranslations } from 'next-intl/server';
import { Container, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { listBarbers } from '@/lib/queries/barbers';
import { BarberCard } from '@/components/discover/BarberCard';
import { BarberSearch } from '@/components/discover/BarberSearch';
import { DistrictFilter } from '@/components/discover/DistrictFilter';

export default async function BarbersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; district?: string }>;
}) {
  const { q, district } = await searchParams;
  const t = await getTranslations('discover');
  const barbers = await listBarbers({ q, district });

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Title order={2}>{t('barbersTitle')}</Title>
        <Group align="flex-end" wrap="wrap">
          <div style={{ flex: 1, minWidth: 200 }}>
            <BarberSearch initialQuery={q ?? ''} />
          </div>
          <DistrictFilter basePath="/barbers" q={q ?? ''} value={district ?? ''} />
        </Group>

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
