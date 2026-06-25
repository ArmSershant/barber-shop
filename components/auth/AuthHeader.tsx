import { Stack, Text, Title } from '@mantine/core';
import { Pole } from '@/components/Pole';

/** Centered card header for auth screens: barber pole + Cormorant title + lead. */
export function AuthHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Stack align="center" gap={6} mb="lg">
      <Pole />
      <Title order={2} ta="center" ff="var(--font-display), Georgia, serif">
        {title}
      </Title>
      {subtitle && (
        <Text c="dimmed" size="sm" ta="center">
          {subtitle}
        </Text>
      )}
    </Stack>
  );
}
