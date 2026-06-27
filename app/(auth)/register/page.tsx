'use client';

import Link from 'next/link';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Anchor,
  Button,
  Container,
  Input,
  Paper,
  PasswordInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { registerSchema, type RegisterInput } from '@/lib/validation/auth';
import { useRegisterMutation } from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';
import { AuthHeader } from '@/components/auth/AuthHeader';

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const router = useRouter();
  const [registerUser, { isLoading }] = useRegisterMutation();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'customer' },
  });

  const roleOptions = [
    { value: 'customer', label: t('roleCustomer') },
    { value: 'barber', label: t('roleBarber') },
    { value: 'shop_owner', label: t('roleShopOwner') },
  ];

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerUser(values).unwrap();
      router.push('/');
    } catch (e) {
      setError('root', { message: apiErrorMessage(e, t('failed')) });
    }
  });

  return (
    <Container size={440} py={60}>
      <Paper
        withBorder
        className="offsetShadow"
        p="xl"
        radius="xs"
        component="form"
        onSubmit={onSubmit}
        noValidate
      >
        <AuthHeader title={t('title')} subtitle={t('subtitle')} />
        <Stack>
          <TextInput
            label={t('fullName')}
            autoComplete="name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <TextInput
            label={t('email')}
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <PasswordInput
            label={t('password')}
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Input.Wrapper label={t('roleLabel')} error={errors.role?.message}>
                <SegmentedControl
                  fullWidth
                  color="espresso"
                  radius="xs"
                  mt={4}
                  data={roleOptions}
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  styles={{
                    label: {
                      whiteSpace: 'normal',
                      lineHeight: 1.15,
                      fontSize: '0.82rem',
                      paddingInline: 6,
                    },
                  }}
                />
              </Input.Wrapper>
            )}
          />
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
        {t('haveAccount')} <Anchor component={Link} href="/login">{t('login')}</Anchor>
      </Text>
    </Container>
  );
}
