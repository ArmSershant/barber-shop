import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button, Container, Stack, Title, Text } from '@mantine/core';

export default function HomePage() {
  const t = useTranslations('home');
  const td = useTranslations('discover');

  return (
    <Container size="sm" py={80}>
      <Stack align="center" gap="md" ta="center">
        <Title order={1}>Barber-Shop</Title>
        <Text fz="lg">{t('subtitle')}</Text>
        <Button component={Link} href="/barbers" size="md">
          {td('browseBarbers')}
        </Button>
        <Text c="dimmed" size="sm">
          {t('note')}
        </Text>
      </Stack>
    </Container>
  );
}
