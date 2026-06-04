'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Button, Group, NumberInput, Select, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createServiceSchema, type CreateServiceInput } from '@/lib/validation/service';
import { SERVICE_TYPES, type ServiceType } from '@/lib/service-types';
import { useCreateServiceMutation, useUpdateServiceMutation, type Service } from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';

export function ServiceForm({ service, onDone }: { service: Service | null; onDone: () => void }) {
  const t = useTranslations('services');
  const tst = useTranslations('serviceTypes');
  const [createService, { isLoading: creating }] = useCreateServiceMutation();
  const [updateService, { isLoading: updating }] = useUpdateServiceMutation();

  const {
    register,
    control,
    watch,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateServiceInput>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      // Legacy rows (no type) edit as "other" with their stored name.
      type: ((service?.type as ServiceType | null) ?? (service ? 'other' : 'haircut')) as ServiceType,
      name: service?.name ?? '',
      description: service?.description ?? '',
      durationMin: service?.durationMin ?? 30,
      priceAmd: service?.priceAmd ?? 0,
    },
  });

  const typeValue = watch('type');
  const typeOptions = SERVICE_TYPES.map((key) => ({ value: key, label: tst(key) }));

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (service) {
        await updateService({ id: service.id, data: values }).unwrap();
        notifications.show({ message: t('updated'), color: 'teal' });
      } else {
        await createService(values).unwrap();
        notifications.show({ message: t('created'), color: 'teal' });
      }
      onDone();
    } catch (e) {
      setError('root', { message: apiErrorMessage(e) });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select
              label={t('typeLabel')}
              data={typeOptions}
              value={field.value}
              onChange={(v) => field.onChange((v ?? 'haircut') as ServiceType)}
              allowDeselect={false}
              searchable
              error={errors.type?.message}
            />
          )}
        />
        {typeValue === 'other' && (
          <TextInput label={t('name')} error={errors.name?.message} {...register('name')} />
        )}
        <Textarea label={t('description')} autosize minRows={2} error={errors.description?.message} {...register('description')} />
        <Controller
          name="durationMin"
          control={control}
          render={({ field }) => (
            <NumberInput
              label={t('duration')}
              description={t('durationHint')}
              min={5}
              max={600}
              step={5}
              value={field.value}
              onChange={(v) => field.onChange(v === '' ? undefined : Number(v))}
              error={errors.durationMin?.message}
            />
          )}
        />
        <Controller
          name="priceAmd"
          control={control}
          render={({ field }) => (
            <NumberInput
              label={t('price')}
              min={0}
              step={500}
              thousandSeparator=" "
              value={field.value}
              onChange={(v) => field.onChange(v === '' ? undefined : Number(v))}
              error={errors.priceAmd?.message}
            />
          )}
        />
        {errors.root && (
          <Text c="red" size="sm">
            {errors.root.message}
          </Text>
        )}
        <Group justify="flex-end">
          <Button type="submit" loading={creating || updating}>
            {service ? t('save') : t('create')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
