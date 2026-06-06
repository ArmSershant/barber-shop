import type { ReactNode } from 'react';
import { Center, Stack, Text, ThemeIcon } from '@mantine/core';

/** Centered placeholder for empty lists/results, with an icon and message. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Center py={56}>
      <Stack align="center" gap="xs" ta="center" maw={360}>
        <ThemeIcon size={56} radius="xl" variant="light" color="gray">
          {icon}
        </ThemeIcon>
        <Text fw={600} fz="lg">
          {title}
        </Text>
        {description && (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        )}
        {action}
      </Stack>
    </Center>
  );
}
