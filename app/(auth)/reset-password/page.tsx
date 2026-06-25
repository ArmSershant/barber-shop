'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Alert, Anchor, Button, Container, Paper, PasswordInput, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useResetPasswordMutation } from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';
import { AuthHeader } from '@/components/auth/AuthHeader';

function ResetPasswordForm() {
  const t = useTranslations('auth.reset');
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [password, setPassword] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await resetPassword({ token, newPassword: password }).unwrap();
      notifications.show({ message: t('done'), color: 'teal' });
      router.push('/login');
    } catch (err) {
      notifications.show({ message: apiErrorMessage(err), color: 'red' });
    }
  };

  return (
    <Container size={440} py={60}>
      <Paper withBorder className="offsetShadow" p="xl" radius="xs">
        <AuthHeader title={t('title')} />
        {!token ? (
          <Alert color="red">{t('invalid')}</Alert>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <Stack>
              <PasswordInput
                label={t('newPassword')}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
              />
              <Button type="submit" loading={isLoading} disabled={password.length < 8} fullWidth>
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
