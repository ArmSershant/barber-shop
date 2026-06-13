import Link from 'next/link';
import type { Route } from 'next';
import { Button, Group } from '@mantine/core';
import { IconMapPin } from '@tabler/icons-react';
import type { DistrictItem } from '@/lib/queries/districts';

/** Quick links to per-district barber listings (local-SEO friendly). */
export function DistrictChips({
  districts,
  locale,
}: {
  districts: DistrictItem[];
  locale: string;
}) {
  return (
    <Group gap="xs" justify="center">
      {districts.map((d) => (
        <Button
          key={d.id}
          component={Link}
          href={`/barbers/district/${d.slug}` as Route}
          variant="default"
          size="xs"
          radius="xl"
          leftSection={<IconMapPin size={13} />}
        >
          {locale === 'hy' ? d.nameHy : d.nameEn}
        </Button>
      ))}
    </Group>
  );
}
