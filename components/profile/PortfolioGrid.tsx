import { Image, SimpleGrid } from '@mantine/core';

/** Responsive grid of portfolio / shop photos. */
export function PortfolioGrid({ images, alt }: { images: { id: string; url: string }[]; alt: string }) {
  return (
    <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm" className="stagger">
      {images.map((img) => (
        <Image
          key={img.id}
          src={img.url}
          alt={alt}
          radius="md"
          h={160}
          fit="cover"
          loading="lazy"
          className="hoverLift"
        />
      ))}
    </SimpleGrid>
  );
}
