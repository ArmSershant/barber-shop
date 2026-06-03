import { useTranslations } from 'next-intl';
import { Container, Stack, Title, Text } from '@mantine/core';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <Container size="sm" py={80}>
      <Stack align="center" gap="xs" ta="center">
        <Title order={1}>Barber-Shop</Title>
        <Text fz="lg">{t('subtitle')}</Text>
        <Text c="dimmed">{t('note')}</Text>
      </Stack>
    </Container>
  );
}
