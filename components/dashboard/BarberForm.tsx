'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Button, NumberInput, Paper, Stack, Text, Textarea, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createBarberSchema, type CreateBarberInput } from '@/lib/validation/provider';
import { useCreateBarberMutation, useUpdateBarberMutation, type Barber } from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';

export function BarberForm({ barber }: { barber: Barber | null }) {
  const t = useTranslations('dashboard.barber');
  const [createBarber, { isLoading: creating }] = useCreateBarberMutation();
  const [updateBarber, { isLoading: updating }] = useUpdateBarberMutation();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateBarberInput>({
    resolver: zodResolver(createBarberSchema),
    defaultValues: {
      displayName: barber?.displayName ?? '',
      bio: barber?.bio ?? '',
      experienceYears: barber?.experienceYears ?? undefined,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (barber) {
        await updateBarber({ slug: barber.slug, data: values }).unwrap();
        notifications.show({ message: t('saved'), color: 'teal' });
      } else {
        await createBarber(values).unwrap();
        notifications.show({ message: t('created'), color: 'teal' });
      }
    } catch (e) {
      setError('root', { message: apiErrorMessage(e) });
    }
  });

  return (
    <Paper withBorder p="lg" radius="md" component="form" onSubmit={onSubmit} noValidate>
      <Stack>
        <Title order={3}>{t('heading')}</Title>
        <TextInput label={t('displayName')} error={errors.displayName?.message} {...register('displayName')} />
        <Textarea label={t('bio')} autosize minRows={2} error={errors.bio?.message} {...register('bio')} />
        <Controller
          name="experienceYears"
          control={control}
          render={({ field }) => (
            <NumberInput
              label={t('experienceYears')}
              min={0}
              max={80}
              value={field.value ?? ''}
              onChange={(value) => field.onChange(value === '' ? undefined : Number(value))}
              error={errors.experienceYears?.message}
            />
          )}
        />
        {errors.root && (
          <Text c="red" size="sm">
            {errors.root.message}
          </Text>
        )}
        <Button type="submit" loading={creating || updating}>
          {barber ? t('save') : t('create')}
        </Button>
      </Stack>
    </Paper>
  );
}
