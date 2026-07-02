'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Button, NumberInput, Paper, Stack, Switch, Text, Textarea, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { barberFormSchema, type BarberFormInput } from '@/lib/validation/provider';
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
  loyaltyEnabled?: boolean | null;
  loyaltyPointsPer100?: number | null;
  loyaltyAmdPerPoint?: number | null;
  loyaltyMaxRedeemPct?: number | null;
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
    watch,
    formState: { errors },
  } = useForm<BarberFormInput>({
    resolver: zodResolver(barberFormSchema),
    defaultValues: {
      displayName: barber?.displayName ?? '',
      slug: barber?.slug ?? undefined,
      bio: barber?.bio ?? '',
      experienceYears: barber?.experienceYears ?? undefined,
      districtId: barber?.districtId ?? undefined,
      photoUrl: barber?.photoUrl ?? undefined,
      coverUrl: barber?.coverUrl ?? undefined,
      requiresApproval: barber?.requiresApproval ?? false,
      loyaltyEnabled: barber?.loyaltyEnabled ?? false,
      loyaltyPointsPer100: barber?.loyaltyPointsPer100 ?? 1,
      loyaltyAmdPerPoint: barber?.loyaltyAmdPerPoint ?? 1,
      loyaltyMaxRedeemPct: barber?.loyaltyMaxRedeemPct ?? 50,
    },
  });

  const loyaltyEnabled = watch('loyaltyEnabled');

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
            <ImageUpload
              value={field.value}
              onChange={field.onChange}
              label={t('cover')}
              radius="md"
              aspect={16 / 7}
              round={false}
              outputWidth={1280}
            />
          )}
        />
        <TextInput label={t('displayName')} error={errors.displayName?.message} {...register('displayName')} />
        {barber && (
          <TextInput
            label={td('urlLabel')}
            description={td('urlHint', { path: '/barbers/' })}
            leftSection={<Text size="sm" c="dimmed">/barbers/</Text>}
            leftSectionWidth={78}
            error={errors.slug?.message}
            {...register('slug')}
          />
        )}
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
        {showApproval && (
          <>
            <Controller
              name="loyaltyEnabled"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.currentTarget.checked)}
                  label={td('loyaltyToggle')}
                  description={td('loyaltyHint')}
                />
              )}
            />
            {loyaltyEnabled && (
              <>
                <Controller
                  name="loyaltyPointsPer100"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      label={td('loyaltyRate')}
                      description={td('loyaltyRateHint')}
                      min={0}
                      max={50}
                      value={field.value ?? 1}
                      onChange={(value) => field.onChange(value === '' ? 0 : Number(value))}
                      error={errors.loyaltyPointsPer100?.message}
                    />
                  )}
                />
                <Controller
                  name="loyaltyAmdPerPoint"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      label={td('loyaltyValue')}
                      description={td('loyaltyValueHint')}
                      min={1}
                      value={field.value ?? 1}
                      onChange={(value) => field.onChange(value === '' ? 1 : Number(value))}
                      error={errors.loyaltyAmdPerPoint?.message}
                    />
                  )}
                />
                <Controller
                  name="loyaltyMaxRedeemPct"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      label={td('loyaltyMaxRedeem')}
                      description={td('loyaltyMaxRedeemHint')}
                      min={0}
                      max={100}
                      value={field.value ?? 50}
                      onChange={(value) => field.onChange(value === '' ? 0 : Number(value))}
                      error={errors.loyaltyMaxRedeemPct?.message}
                    />
                  )}
                />
              </>
            )}
          </>
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
