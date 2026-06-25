'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Anchor, Button, Container, Paper, Stack, Text, TextInput } from '@mantine/core';
import { useForgotPasswordMutation } from '@/lib/store/api';
import { AuthHeader } from '@/components/auth/AuthHeader';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgot');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Always show the same confirmation, regardless of whether the email exists.
    try {
      await forgotPassword({ email: email.trim() }).unwrap();
    } catch {
      /* ignore — don't reveal whether the email is registered */
    }
    setSent(true);
  };

  return (
    <Container size={440} py={60}>
      <Paper withBorder className="offsetShadow" p="xl" radius="xs">
        <AuthHeader title={t('title')} subtitle={t('subtitle')} />
        {sent ? (
          <Text size="sm" c="dimmed" fs="italic" ta="center">
            {t('sent')}
          </Text>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <Stack>
              <TextInput
                label={t('email')}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                required
              />
              <Button type="submit" loading={isLoading} fullWidth>
                {t('submit')}
              </Button>
            </Stack>
          </form>
        )}
      </Paper>

      <Text c="dimmed" size="sm" ta="center" mt="md">
        <Anchor component={Link} href="/login">
          ← {t('backToLogin')}
        </Anchor>
      </Text>
    </Container>
  );
}
