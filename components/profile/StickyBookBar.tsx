import { Button, Text } from '@mantine/core';
import { IconCalendarPlus } from '@tabler/icons-react';
import styles from './StickyBookBar.module.scss';

/** Mobile-only fixed bar that keeps a Book CTA in reach; jumps to the booking widget. */
export function StickyBookBar({ priceLabel, bookLabel }: { priceLabel?: string; bookLabel: string }) {
  return (
    <div className={styles.bar}>
      <Text fw={600}>{priceLabel}</Text>
      <Button component="a" href="#book" leftSection={<IconCalendarPlus size={16} />}>
        {bookLabel}
      </Button>
    </div>
  );
}
