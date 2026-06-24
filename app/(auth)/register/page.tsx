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
  Paper,
  PasswordInput,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { registerSchema, type RegisterInput } from '@/lib/validation/auth';
import { useRegisterMutation } from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';

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
              <Select
                label={t('roleLabel')}
                data={roleOptions}
                value={field.value}
                onChange={(value) => field.onChange(value ?? 'customer')}
                allowDeselect={false}
                error={errors.role?.message}
              />
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
