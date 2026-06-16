'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Alert, Anchor, Center, Container, Loader, Stack, Text, Title } from '@mantine/core';
import { useVerifyEmailMutation } from '@/lib/store/api';

function VerifyEmail() {
  const t = useTranslations('auth.verify');
  const token = useSearchParams().get('token') ?? '';
  const [verifyEmail] = useVerifyEmailMutation();
  const [state, setState] = useState<'pending' | 'success' | 'error'>('pending');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard StrictMode double-run
    ran.current = true;
    if (!token) {
      setState('error');
      return;
    }
    verifyEmail({ token })
      .unwrap()
      .then(() => setState('success'))
      .catch(() => setState('error'));
  }, [token, verifyEmail]);

  return (
    <Container size={420} py={60}>
      <Title order={2} ta="center">
        {t('title')}
      </Title>
      <Stack mt="lg" align="center">
        {state === 'pending' && (
          <Center py="md">
            <Loader />
          </Center>
        )}
        {state === 'success' && <Alert color="teal" w="100%">{t('success')}</Alert>}
        {state === 'error' && <Alert color="red" w="100%">{t('error')}</Alert>}
        <Text size="sm">
          <Anchor component={Link} href="/">
            {t('home')}
          </Anchor>
        </Text>
      </Stack>
    </Container>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}
