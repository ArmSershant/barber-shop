'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Group, Modal, Slider, Stack, Text } from '@mantine/core';
import { IconArrowsMove } from '@tabler/icons-react';

const VIEWPORT_WIDTH = 300; // px — the crop window width (height derives from aspect)
const MAX_ZOOM = 3;

type Offset = { x: number; y: number };

/**
 * Facebook-style reposition + zoom cropper. The user drags/zooms a source
 * image inside a fixed-aspect window; on apply we render the visible region
 * to a canvas and return a cropped JPEG blob.
 */
export function ImageCropModal({
  file,
  aspect,
  round = false,
  outputWidth,
  onCancel,
  onApply,
}: {
  file: File | null;
  aspect: number;
  round?: boolean;
  outputWidth: number;
  onCancel: () => void;
  onApply: (blob: Blob) => void;
}) {
  const t = useTranslations('dashboard');
  const viewportH = Math.round(VIEWPORT_WIDTH / aspect);

  const [src, setSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });

  const drag = useRef<{ startX: number; startY: number; origin: Offset } | null>(null);

  // Load the picked file into an object URL.
  useEffect(() => {
    if (!file) {
      setSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setZoom(1);
    setNatural(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale = natural ? Math.max(VIEWPORT_WIDTH / natural.w, viewportH / natural.h) : 1;
  const scale = baseScale * zoom;

  const clamp = useCallback(
    (next: Offset, atScale: number): Offset => {
      if (!natural) return next;
      const dispW = natural.w * atScale;
      const dispH = natural.h * atScale;
      return {
        x: Math.min(0, Math.max(VIEWPORT_WIDTH - dispW, next.x)),
        y: Math.min(0, Math.max(viewportH - dispH, next.y)),
      };
    },
    [natural, viewportH],
  );

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setNatural({ w, h });
    const bScale = Math.max(VIEWPORT_WIDTH / w, viewportH / h);
    const dispW = w * bScale;
    const dispH = h * bScale;
    setOffset({ x: (VIEWPORT_WIDTH - dispW) / 2, y: (viewportH - dispH) / 2 });
  };

  // Keep the viewport center fixed while zooming.
  const onZoom = (z: number) => {
    if (!natural) {
      setZoom(z);
      return;
    }
    const newScale = baseScale * z;
    const centerImgX = (VIEWPORT_WIDTH / 2 - offset.x) / scale;
    const centerImgY = (viewportH / 2 - offset.y) / scale;
    const next = {
      x: VIEWPORT_WIDTH / 2 - centerImgX * newScale,
      y: viewportH / 2 - centerImgY * newScale,
    };
    setZoom(z);
    setOffset(clamp(next, newScale));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, origin: offset };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const next = {
      x: drag.current.origin.x + (e.clientX - drag.current.startX),
      y: drag.current.origin.y + (e.clientY - drag.current.startY),
    };
    setOffset(clamp(next, scale));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const apply = () => {
    if (!imgRef.current || !natural) return;
    const cropX = -offset.x / scale;
    const cropY = -offset.y / scale;
    const cropW = VIEWPORT_WIDTH / scale;
    const cropH = viewportH / scale;

    const outW = outputWidth;
    const outH = Math.round(outputWidth / aspect);
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(imgRef.current, cropX, cropY, cropW, cropH, 0, 0, outW, outH);
    canvas.toBlob((blob) => blob && onApply(blob), 'image/jpeg', 0.92);
  };

  return (
    <Modal opened={!!file} onClose={onCancel} title={t('cropTitle')} centered size="auto" radius="md">
      <Stack gap="md" align="center">
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            position: 'relative',
            width: VIEWPORT_WIDTH,
            height: viewportH,
            overflow: 'hidden',
            borderRadius: round ? '50%' : 'var(--mantine-radius-md)',
            background: 'var(--surf2)',
            cursor: 'grab',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          {src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              onLoad={onImgLoad}
              style={{
                position: 'absolute',
                left: offset.x,
                top: offset.y,
                width: natural ? natural.w * scale : 'auto',
                height: natural ? natural.h * scale : 'auto',
                maxWidth: 'none',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        <Group gap={6} c="dimmed" justify="center" style={{ width: VIEWPORT_WIDTH }}>
          <IconArrowsMove size={14} />
          <Text size="xs" ta="center">
            {t('cropHint')}
          </Text>
        </Group>

        <div style={{ width: VIEWPORT_WIDTH }}>
          <Text size="xs" c="dimmed" mb={4}>
            {t('cropZoom')}
          </Text>
          <Slider
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={onZoom}
            label={null}
            disabled={!natural}
          />
        </div>

        <Group justify="flex-end" w="100%">
          <Button variant="default" size="xs" onClick={onCancel}>
            {t('cropCancel')}
          </Button>
          <Button size="xs" onClick={apply} disabled={!natural}>
            {t('cropApply')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
