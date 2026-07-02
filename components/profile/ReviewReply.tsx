'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Box, Button, Group, Text, Textarea } from '@mantine/core';
import { IconCornerDownRight } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

/**
 * Shows a provider's reply under a review (visible to everyone) and, for the
 * profile owner, an inline editor to add/edit it.
 */
export function ReviewReply({
  reviewId,
  reply,
  canReply,
}: {
  reviewId: string;
  reply: string | null;
  canReply: boolean;
}) {
  const t = useTranslations('reviews');
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(reply ?? '');
  const [pending, startTransition] = useTransition();

  const save = async () => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reply: value }),
      });
      if (!res.ok) throw new Error('Failed');
      notifications.show({ message: t('replySaved'), color: 'teal' });
      setEditing(false);
      startTransition(() => router.refresh());
    } catch {
      notifications.show({ message: t('replyError'), color: 'red' });
    }
  };

  if (reply && !editing) {
    return (
      <Box mt={8} pl="sm" style={{ borderLeft: '2px solid var(--gold)' }}>
        <Group gap={6} wrap="nowrap">
          <IconCornerDownRight size={14} color="var(--gold)" />
          <Text size="xs" fw={600} c="var(--gold)">
            {t('replyFrom')}
          </Text>
        </Group>
        <Text size="sm" mt={2}>
          {reply}
        </Text>
        {canReply && (
          <Button variant="subtle" size="compact-xs" mt={4} onClick={() => setEditing(true)}>
            {t('replyEdit')}
          </Button>
        )}
      </Box>
    );
  }

  if (!canReply) return null;

  if (!editing) {
    return (
      <Button variant="subtle" size="compact-xs" mt={6} leftSection={<IconCornerDownRight size={13} />} onClick={() => setEditing(true)}>
        {t('replyLabel')}
      </Button>
    );
  }

  return (
    <Box mt={8}>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        placeholder={t('replyPlaceholder')}
        autosize
        minRows={2}
        maxLength={1000}
      />
      <Group gap="xs" mt={6}>
        <Button size="xs" onClick={save} loading={pending}>
          {t('replySave')}
        </Button>
        <Button size="xs" variant="default" onClick={() => { setEditing(false); setValue(reply ?? ''); }}>
          {t('replyCancel')}
        </Button>
      </Group>
    </Box>
  );
}
