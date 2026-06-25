import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button, Container, Stack, Text } from '@mantine/core';

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <Container size={460} py={100}>
      <Stack align="center" gap="xs" ta="center">
        <Text
          style={{
            fontFamily: 'var(--font-display), Georgia, serif',
            fontWeight: 700,
            fontSize: 'clamp(4rem, 14vw, 7rem)',
            lineHeight: 1,
            color: 'var(--ox)',
          }}
        >
          404
        </Text>
        <Text fz="xl" fs="italic" ff="var(--font-display), Georgia, serif" c="var(--gold)">
          {t('heading')}
        </Text>
        <Text c="dimmed" maw={360}>
          {t('body')}
        </Text>
        <Button component={Link} href="/" mt="md">
          {t('home')}
        </Button>
      </Stack>
    </Container>
  );
}
