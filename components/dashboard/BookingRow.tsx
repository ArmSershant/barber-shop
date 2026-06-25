import type { ReactNode } from 'react';
import { Group, Paper, Text } from '@mantine/core';
import styles from './BookingRow.module.scss';

/** Heritage booking row: a date block (big Cormorant day + month·time) divided
 * from the client/service details, with a right-hand slot for status + actions. */
export function BookingRow({
  date,
  title,
  subtitle,
  right,
  highlight,
}: {
  date: Date;
  title: string;
  subtitle: ReactNode;
  right?: ReactNode;
  highlight?: boolean;
}) {
  const day = date.getDate();
  const month = date.toLocaleDateString([], { month: 'short' }).toUpperCase();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Paper
      withBorder
      radius="xs"
      p="md"
      style={highlight ? { borderColor: 'var(--gold)' } : undefined}
    >
      <Group wrap="nowrap" gap="md" align="center">
        <div className={styles.dateBlock}>
          <span className={styles.day}>{day}</span>
          <span className={styles.sub}>
            {month} · {time}
          </span>
        </div>
        <div className={styles.body}>
          <Text fw={600} truncate>
            {title}
          </Text>
          <Text size="sm" c="dimmed" truncate>
            {subtitle}
          </Text>
        </div>
        {right && <div className={styles.actions}>{right}</div>}
      </Group>
    </Paper>
  );
}
