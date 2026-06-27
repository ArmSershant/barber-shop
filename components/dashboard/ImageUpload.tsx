'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Avatar, Button, Group, Text } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { ImageCropModal } from './ImageCropModal';

const ACCEPT = 'image/png,image/jpeg,image/webp';

/** Pick an image, crop/reposition it, upload to /api/upload, report the URL. */
export function ImageUpload({
  value,
  onChange,
  label,
  radius = 'xl',
  aspect = 1,
  round = true,
  outputWidth = 512,
}: {
  value?: string | null;
  onChange: (url: string) => void;
  label: string;
  radius?: string | number;
  /** Crop window aspect ratio (width / height). */
  aspect?: number;
  /** Round crop mask (profile photos) vs rectangular (covers). */
  round?: boolean;
  /** Exported image width in px. */
  outputWidth?: number;
}) {
  const t = useTranslations('dashboard');
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (file) setPendingFile(file);
  };

  const uploadBlob = async (blob: Blob) => {
    setPendingFile(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', new File([blob], 'image.jpg', { type: 'image/jpeg' }));
      const res = await fetch('/api/upload', { method: 'POST', body, credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? 'Upload failed');
      onChange(json.url as string);
    } catch (err) {
      notifications.show({
        message: err instanceof Error ? err.message : 'Upload failed',
        color: 'red',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Text size="sm" fw={500} mb={6}>
        {label}
      </Text>
      <Group>
        <Avatar src={value ?? undefined} size="lg" radius={radius} color="brand" />
        <Button
          variant="light"
          size="xs"
          onClick={() => inputRef.current?.click()}
          loading={uploading}
          leftSection={<IconUpload size={14} />}
        >
          {value ? t('changePhoto') : t('uploadPhoto')}
        </Button>
        <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={onPick} />
      </Group>

      <ImageCropModal
        file={pendingFile}
        aspect={aspect}
        round={round}
        outputWidth={outputWidth}
        onCancel={() => setPendingFile(null)}
        onApply={uploadBlob}
      />
    </div>
  );
}
