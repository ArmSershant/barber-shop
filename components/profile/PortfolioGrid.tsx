'use client';

import { useCallback, useEffect, useState } from 'react';
import NextImage from 'next/image';
import { ActionIcon, Modal, SimpleGrid, Text, UnstyledButton } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react';

type GalleryImage = { id: string; url: string };

/**
 * Responsive grid of portfolio / shop photos. Clicking a photo opens a
 * full-size lightbox with prev/next navigation (arrow keys + on-screen).
 */
export function PortfolioGrid({ images, alt }: { images: GalleryImage[]; alt: string }) {
  const [active, setActive] = useState<number | null>(null);
  const isOpen = active !== null;

  const close = useCallback(() => setActive(null), []);
  const next = useCallback(
    () => setActive((i) => (i === null ? i : (i + 1) % images.length)),
    [images.length],
  );
  const prev = useCallback(
    () => setActive((i) => (i === null ? i : (i - 1 + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, next, prev]);

  const hasMany = images.length > 1;

  return (
    <>
      <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm" className="stagger">
        {images.map((img, index) => (
          <UnstyledButton
            key={img.id}
            className="hoverLift"
            onClick={() => setActive(index)}
            aria-label={`${alt} — open photo ${index + 1}`}
            style={{
              position: 'relative',
              aspectRatio: '1 / 1',
              borderRadius: 'var(--mantine-radius-md)',
              overflow: 'hidden',
              cursor: 'zoom-in',
            }}
          >
            <NextImage
              src={img.url}
              alt={alt}
              fill
              sizes="(max-width: 48em) 50vw, (max-width: 62em) 33vw, 25vw"
              style={{ objectFit: 'cover' }}
            />
          </UnstyledButton>
        ))}
      </SimpleGrid>

      <Modal
        opened={isOpen}
        onClose={close}
        withCloseButton={false}
        fullScreen
        padding={0}
        transitionProps={{ transition: 'fade', duration: 150 }}
        styles={{
          content: { background: 'rgba(0, 0, 0, 0.94)' },
          body: { height: '100%', padding: 0 },
        }}
      >
        {isOpen && (
          <div
            onClick={close}
            style={{
              position: 'relative',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Stop clicks on the image itself from closing the lightbox. */}
            <div onClick={(e) => e.stopPropagation()} style={{ lineHeight: 0 }}>
              <NextImage
                src={images[active].url}
                alt={alt}
                width={1280}
                height={1280}
                sizes="100vw"
                style={{
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '100vw',
                  maxHeight: '100vh',
                  objectFit: 'contain',
                }}
              />
            </div>

            <ActionIcon
              variant="filled"
              color="dark"
              radius="xl"
              size="lg"
              onClick={close}
              aria-label="Close"
              style={{ position: 'absolute', top: 16, right: 16 }}
            >
              <IconX size={18} />
            </ActionIcon>

            {hasMany && (
              <>
                <ActionIcon
                  variant="filled"
                  color="dark"
                  radius="xl"
                  size="xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    prev();
                  }}
                  aria-label="Previous photo"
                  style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)' }}
                >
                  <IconChevronLeft size={22} />
                </ActionIcon>
                <ActionIcon
                  variant="filled"
                  color="dark"
                  radius="xl"
                  size="xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                  aria-label="Next photo"
                  style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)' }}
                >
                  <IconChevronRight size={22} />
                </ActionIcon>

                <Text
                  size="sm"
                  c="white"
                  style={{
                    position: 'absolute',
                    bottom: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.6)',
                    padding: '2px 10px',
                    borderRadius: 999,
                  }}
                >
                  {active + 1} / {images.length}
                </Text>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
