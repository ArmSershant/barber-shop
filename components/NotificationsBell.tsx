'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ActionIcon,
  Indicator,
  Popover,
  ScrollArea,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import {
  useGetNotificationsQuery,
  useReadAllNotificationsMutation,
  type NotificationItem,
} from '@/lib/store/api';

export function NotificationsBell() {
  const t = useTranslations('notifications');
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  const { data } = useGetNotificationsQuery(undefined, { pollingInterval: 30_000 });
  const [readAll] = useReadAllNotificationsMutation();

  const unread = data?.unread ?? 0;
  const items = data?.notifications ?? [];

  const toggle = () => {
    const next = !opened;
    setOpened(next);
    if (next && unread > 0) readAll();
  };

  const openBooking = () => {
    setOpened(false);
    router.push('/dashboard/bookings');
  };

  const message = (n: NotificationItem) => {
    const name = String(n.payload?.customerName ?? '');
    const when = n.payload?.startsAt
      ? new Date(String(n.payload.startsAt)).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
      : '';
    if (n.type === 'booking_created') return t('newBooking', { name, when });
    if (n.type === 'booking_cancelled') return t('cancelled', { name, when });
    return n.type;
  };

  return (
    <Popover opened={opened} onChange={setOpened} position="bottom-end" width={340} withinPortal>
      <Popover.Target>
        <Indicator disabled={unread === 0} label={unread > 9 ? '9+' : unread} size={16} color="red">
          <ActionIcon variant="default" size="lg" aria-label={t('title')} onClick={toggle}>
            <span style={{ fontSize: 14 }}>🔔</span>
          </ActionIcon>
        </Indicator>
      </Popover.Target>
      <Popover.Dropdown>
        <Text fw={600} mb="xs">
          {t('title')}
        </Text>
        {items.length === 0 ? (
          <Text c="dimmed" size="sm">
            {t('empty')}
          </Text>
        ) : (
          <ScrollArea.Autosize mah={300}>
            <Stack gap="xs">
              {items.map((n) => (
                <UnstyledButton key={n.id} onClick={openBooking}>
                  <Text size="sm" fw={n.readAt ? 400 : 600}>
                    {message(n)}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {new Date(n.createdAt).toLocaleString()}
                  </Text>
                </UnstyledButton>
              ))}
            </Stack>
          </ScrollArea.Autosize>
        )}
      </Popover.Dropdown>
    </Popover>
  );
}
