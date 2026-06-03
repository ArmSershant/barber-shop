'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Anchor, Center, Container, Loader, Stack, Title } from '@mantine/core';
import { useGetBarberQuery } from '@/lib/store/api';
import { BarberForm } from '@/components/dashboard/BarberForm';
import { WorkingHoursSection } from '@/components/dashboard/WorkingHoursSection';
import { BreaksSection } from '@/components/dashboard/BreaksSection';
import { TimeOffSection } from '@/components/dashboard/TimeOffSection';

export default function ManageBarberPage() {
  const t = useTranslations('roster');
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { data, isLoading } = useGetBarberQuery(slug);

  if (isLoading) {
    return (
      <Center py={80}>
        <Loader />
      </Center>
    );
  }

  const barber = data?.barber ?? null;

  return (
    <Container size="sm" py="xl">
      <Stack>
        <Anchor component={Link} href="/dashboard" size="sm">
          ← {t('back')}
        </Anchor>
        <Title order={2}>{barber?.displayName ?? ''}</Title>
        {barber && (
          <>
            <BarberForm barber={barber} />
            <WorkingHoursSection barberSlug={slug} />
            <BreaksSection barberSlug={slug} />
            <TimeOffSection barberSlug={slug} />
          </>
        )}
      </Stack>
    </Container>
  );
}
