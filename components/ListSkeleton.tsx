import { Group, Paper, Skeleton, Stack } from '@mantine/core';

/** Placeholder rows shown while a list of cards loads — feels faster than a spinner. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Stack gap="md">
      {Array.from({ length: rows }).map((_, i) => (
        <Paper key={i} withBorder p="md" radius="md">
          <Group justify="space-between" wrap="nowrap">
            <Group wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
              <Skeleton height={44} circle />
              <Stack gap={8} style={{ flex: 1 }}>
                <Skeleton height={12} width="40%" radius="xl" />
                <Skeleton height={10} width="65%" radius="xl" />
              </Stack>
            </Group>
            <Skeleton height={28} width={84} radius="sm" />
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}
