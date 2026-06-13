'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ActionIcon, Button, Group, Image, Paper, SimpleGrid, Text, Title } from '@mantine/core';
import { IconUpload, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useGetBarberPortfolioQuery,
  useAddBarberPortfolioMutation,
  useDeleteBarberPortfolioMutation,
  useGetShopPhotosQuery,
  useAddShopPhotoMutation,
  useDeleteShopPhotoMutation,
  type GalleryImage,
} from '@/lib/store/api';
import { apiErrorMessage } from '@/lib/api-error';

const ACCEPT = 'image/png,image/jpeg,image/webp';

function GalleryManager({
  images,
  busy,
  onAdd,
  onDelete,
}: {
  images: GalleryImage[];
  busy: boolean;
  onAdd: (url: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const t = useTranslations('gallery');
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body, credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? 'Upload failed');
      await onAdd(json.url as string);
    } catch (err) {
      notifications.show({ message: err instanceof Error ? err.message : 'Upload failed', color: 'red' });
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await onDelete(id);
    } catch (err) {
      notifications.show({ message: apiErrorMessage(err), color: 'red' });
    }
  };

  return (
    <Paper withBorder p="lg" radius="md">
      <Group justify="space-between" mb="md">
        <Title order={3}>{t('heading')}</Title>
        <Button
          size="xs"
          variant="light"
          leftSection={<IconUpload size={14} />}
          loading={uploading || busy}
          onClick={() => inputRef.current?.click()}
        >
          {t('add')}
        </Button>
      </Group>

      {images.length === 0 ? (
        <Text c="dimmed" size="sm">
          {t('empty')}
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 3, sm: 4 }} spacing="sm">
          {images.map((img) => (
            <div key={img.id} style={{ position: 'relative' }}>
              <Image src={img.url} h={100} radius="md" fit="cover" alt="" />
              <ActionIcon
                color="red"
                variant="filled"
                size="sm"
                radius="xl"
                aria-label={t('delete')}
                onClick={() => remove(img.id)}
                style={{ position: 'absolute', top: 4, right: 4 }}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </div>
          ))}
        </SimpleGrid>
      )}
      <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={onFile} />
    </Paper>
  );
}

export function BarberPortfolioSection({ slug }: { slug: string }) {
  const { data } = useGetBarberPortfolioQuery(slug);
  const [add, { isLoading: adding }] = useAddBarberPortfolioMutation();
  const [del] = useDeleteBarberPortfolioMutation();
  return (
    <GalleryManager
      images={data?.images ?? []}
      busy={adding}
      onAdd={async (url) => {
        await add({ slug, url }).unwrap();
      }}
      onDelete={async (id) => {
        await del({ slug, id }).unwrap();
      }}
    />
  );
}

export function ShopPhotosSection({ slug }: { slug: string }) {
  const { data } = useGetShopPhotosQuery(slug);
  const [add, { isLoading: adding }] = useAddShopPhotoMutation();
  const [del] = useDeleteShopPhotoMutation();
  return (
    <GalleryManager
      images={data?.photos ?? []}
      busy={adding}
      onAdd={async (url) => {
        await add({ slug, url }).unwrap();
      }}
      onDelete={async (id) => {
        await del({ slug, id }).unwrap();
      }}
    />
  );
}
