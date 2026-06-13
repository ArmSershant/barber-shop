'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Button, Paper, Stack, Text, Textarea, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createShopSchema, type CreateShopInput } from '@/lib/validation/provider';
import { useCreateShopMutation, useUpdateShopMutation, type Shop } from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';
import { DistrictSelectField } from './DistrictSelectField';
import { ImageUpload } from './ImageUpload';

export function ShopForm({ shop }: { shop: Shop | null }) {
  const t = useTranslations('dashboard.shop');
  const [createShop, { isLoading: creating }] = useCreateShopMutation();
  const [updateShop, { isLoading: updating }] = useUpdateShopMutation();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateShopInput>({
    resolver: zodResolver(createShopSchema),
    defaultValues: {
      name: shop?.name ?? '',
      description: shop?.description ?? '',
      address: shop?.address ?? '',
      phone: shop?.phone ?? '',
      instagram: shop?.instagram ?? '',
      districtId: shop?.districtId ?? undefined,
      logoUrl: shop?.logoUrl ?? undefined,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (shop) {
        await updateShop({ slug: shop.slug, data: values }).unwrap();
        notifications.show({ message: t('saved'), color: 'teal' });
      } else {
        await createShop(values).unwrap();
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
          name="logoUrl"
          control={control}
          render={({ field }) => (
            <ImageUpload value={field.value} onChange={field.onChange} label={t('logo')} radius="md" />
          )}
        />
        <TextInput label={t('name')} error={errors.name?.message} {...register('name')} />
        <Textarea label={t('description')} autosize minRows={2} error={errors.description?.message} {...register('description')} />
        <Controller
          name="districtId"
          control={control}
          render={({ field }) => (
            <DistrictSelectField value={field.value} onChange={field.onChange} error={errors.districtId?.message} />
          )}
        />
        <TextInput label={t('address')} error={errors.address?.message} {...register('address')} />
        <TextInput label={t('phone')} error={errors.phone?.message} {...register('phone')} />
        <TextInput label={t('instagram')} error={errors.instagram?.message} {...register('instagram')} />
        {errors.root && (
          <Text c="red" size="sm">
            {errors.root.message}
          </Text>
        )}
        <Button type="submit" loading={creating || updating}>
          {shop ? t('save') : t('create')}
        </Button>
      </Stack>
    </Paper>
  );
}
