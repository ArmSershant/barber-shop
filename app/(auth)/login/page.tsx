'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Anchor,
  Button,
  Container,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { loginSchema, type LoginInput } from '@/lib/validation/auth';
import { useLoginMutation } from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values).unwrap();
      router.push('/');
    } catch (e) {
      setError('root', { message: apiErrorMessage(e, t('invalid')) });
    }
  });

  return (
    <Container size={420} py={60}>
      <Title order={2} ta="center">
        {t('title')}
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={4}>
        {t('subtitle')}
      </Text>

      <Paper
        withBorder
        className="offsetShadow"
        p="lg"
        radius="xs"
        mt="lg"
        component="form"
        onSubmit={onSubmit}
        noValidate
      >
        <Stack>
          <TextInput
            label={t('email')}
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <PasswordInput
            label={t('password')}
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Anchor component={Link} href="/forgot-password" size="xs" style={{ alignSelf: 'flex-end' }}>
            {t('forgot')}
          </Anchor>
          {errors.root && (
            <Text c="red" size="sm">
              {errors.root.message}
            </Text>
          )}
          <Button type="submit" loading={isLoading} fullWidth>
            {t('submit')}
          </Button>
        </Stack>
      </Paper>

      <Text c="dimmed" size="sm" ta="center" mt="md">
        {t('noAccount')} <Anchor component={Link} href="/register">{t('signup')}</Anchor>
      </Text>
    </Container>
  );
}
