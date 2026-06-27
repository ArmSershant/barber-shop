'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Button, NumberInput, Paper, Stack, Switch, Text, Textarea, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createBarberSchema, type CreateBarberInput } from '@/lib/validation/provider';
import { useCreateBarberMutation, useUpdateBarberMutation } from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';
import { DistrictSelectField } from './DistrictSelectField';
import { ImageUpload } from './ImageUpload';

// Minimal shape the form needs — satisfied by both the RTK `Barber` type and
// the public barber profile, so it works for self-edit and shop-roster edit.
export interface EditableBarber {
  slug: string;
  displayName: string;
  bio?: string | null;
  experienceYears?: number | null;
  districtId?: number | null;
  photoUrl?: string | null;
  coverUrl?: string | null;
  requiresApproval?: boolean | null;
  shopId?: string | null;
}

export function BarberForm({ barber }: { barber: EditableBarber | null }) {
  const t = useTranslations('dashboard.barber');
  const td = useTranslations('dashboard');
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
      districtId: barber?.districtId ?? undefined,
      photoUrl: barber?.photoUrl ?? undefined,
      coverUrl: barber?.coverUrl ?? undefined,
      requiresApproval: barber?.requiresApproval ?? false,
    },
  });

  // A barber's own approval setting only applies when they're independent;
  // shop barbers inherit the shop's setting, so hide the toggle for them.
  const showApproval = !barber?.shopId;

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
        <Controller
          name="photoUrl"
          control={control}
          render={({ field }) => (
            <ImageUpload value={field.value} onChange={field.onChange} label={t('photo')} radius="xl" />
          )}
        />
        <Controller
          name="coverUrl"
          control={control}
          render={({ field }) => (
            <ImageUpload value={field.value} onChange={field.onChange} label={t('cover')} radius="md" />
          )}
        />
        <TextInput label={t('displayName')} error={errors.displayName?.message} {...register('displayName')} />
        <Textarea
          label={t('bio')}
          description={t('bioHint')}
          placeholder={t('bioPlaceholder')}
          autosize
          minRows={3}
          error={errors.bio?.message}
          {...register('bio')}
        />
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
        <Controller
          name="districtId"
          control={control}
          render={({ field }) => (
            <DistrictSelectField value={field.value} onChange={field.onChange} error={errors.districtId?.message} />
          )}
        />
        {showApproval && (
          <Controller
            name="requiresApproval"
            control={control}
            render={({ field }) => (
              <Switch
                checked={!!field.value}
                onChange={(e) => field.onChange(e.currentTarget.checked)}
                label={td('requiresApproval')}
                description={td('requiresApprovalHint')}
              />
            )}
          />
        )}
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
