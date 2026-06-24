import NextImage from 'next/image';
import { SimpleGrid } from '@mantine/core';

/** Responsive grid of portfolio / shop photos, optimized via next/image. */
export function PortfolioGrid({ images, alt }: { images: { id: string; url: string }[]; alt: string }) {
  return (
    <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm" className="stagger">
      {images.map((img) => (
        <div
          key={img.id}
          className="hoverLift"
          style={{
            position: 'relative',
            aspectRatio: '1 / 1',
            borderRadius: 'var(--mantine-radius-md)',
            overflow: 'hidden',
          }}
        >
          <NextImage
            src={img.url}
            alt={alt}
            fill
            sizes="(max-width: 48em) 50vw, (max-width: 62em) 33vw, 25vw"
            style={{ objectFit: 'cover' }}
          />
        </div>
      ))}
    </SimpleGrid>
  );
}
