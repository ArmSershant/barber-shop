import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { getLocale, getTranslations } from 'next-intl/server';
import { Anchor, Container, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconBuildingStore } from '@tabler/icons-react';
import { HeroSearch } from '@/components/HeroSearch';
import { DistrictChips } from '@/components/DistrictChips';
import { ProviderCtaButton } from '@/components/ProviderCtaButton';
import { BarberCard } from '@/components/discover/BarberCard';
import { SectionHeader } from '@/components/profile/SectionHeader';
import { listDistricts } from '@/lib/queries/districts';
import { listBarbers } from '@/lib/queries/barbers';
import { getHomeStats } from '@/lib/queries/home';
import { getCurrentUser } from '@/lib/auth/session';
import styles from './home.module.scss';

async function fetchHomeData(includeTest: boolean) {
  const [districts, topBarbers, stats] = await Promise.all([
    listDistricts().catch(() => []),
    listBarbers({ includeTest }).catch(() => []),
    getHomeStats(includeTest).catch(() => ({ barbers: 0, shops: 0, districts: 0 })),
  ]);
  return { districts, topBarbers: topBarbers.slice(0, 3), stats };
}

// The public home content (districts, top barbers, counts) changes rarely, so
// cache it for a few minutes instead of hitting Neon on every request. Admins
// bypass the cache so they can see test/internal accounts too.
const getCachedHomeData = unstable_cache(() => fetchHomeData(false), ['home-data'], {
  revalidate: 300,
  tags: ['home-data'],
});

export default async function HomePage() {
  const t = await getTranslations('home');
  const locale = await getLocale();
  const viewer = await getCurrentUser();
  const isAdmin = viewer?.roles?.includes('admin') ?? false;
  const { districts, topBarbers: featured, stats } = isAdmin
    ? await fetchHomeData(true)
    : await getCachedHomeData();

  const statItems = [
    { value: stats.barbers, label: t('statBarbers') },
    { value: stats.shops, label: t('statShops') },
    { value: stats.districts, label: t('statDistricts') },
  ];

  const steps = [
    { n: 'I', title: t('feat1Title'), desc: t('feat1Desc') },
    { n: 'II', title: t('feat2Title'), desc: t('feat2Desc') },
    { n: 'III', title: t('feat3Title'), desc: t('feat3Desc') },
  ];

  return (
    <Container size="lg" py={64}>
      <Stack gap={72}>
        {/* HERO — no entrance animation so the LCP (title) paints immediately. */}
        <Stack align="center" gap="lg" ta="center">
          <Text className={styles.eyebrow}>{t('heroEyebrow')}</Text>

          <Title order={1} className={styles.heroTitle}>
            {t('heroTitle')}
            <span className={styles.heroTitleEm}>{t('heroTitleEm')}</span>
          </Title>

          <Text fz="lg" c="dimmed" maw={560}>
            {t('heroLead')}
          </Text>

          <HeroSearch />

          <Group gap={0} justify="center" className={styles.stats}>
            {statItems.map((s) => (
              <div key={s.label} className={styles.stat}>
                <span className={styles.statValue}>{s.value.toLocaleString()}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </Group>
        </Stack>

        {/* BROWSE BY DISTRICT */}
        {districts.length > 0 && (
          <Stack gap="md" align="center">
            <Title order={3} ta="center" ff="var(--font-display), Georgia, serif">
              {t('browseByDistrict')}
            </Title>
            <DistrictChips districts={districts} locale={locale} />
          </Stack>
        )}

        {/* TOP-RATED BARBERS */}
        {featured.length > 0 && (
          <Stack gap="md">
            <Group align="flex-end" wrap="nowrap" gap="md">
              <div style={{ flex: 1, minWidth: 0 }}>
                <SectionHeader>{t('topRated')}</SectionHeader>
              </div>
              <Anchor
                component={Link}
                href="/barbers"
                c="dimmed"
                className={styles.viewAll}
              >
                {t('viewAll')} →
              </Anchor>
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" className="stagger">
              {featured.map((barber) => (
                <BarberCard key={barber.id} barber={barber} />
              ))}
            </SimpleGrid>
          </Stack>
        )}

        {/* HOW IT WORKS */}
        <Stack gap="xl" align="center">
          <Title order={2} ta="center" ff="var(--font-display), Georgia, serif">
            {t('howItWorks')}
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={48} w="100%">
            {steps.map((step) => (
              <Stack key={step.n} gap={6} align="center" ta="center" px="md">
                <span className={styles.stepNumeral}>{step.n}</span>
                <Text fw={600} fz="xl" ff="var(--font-display), Georgia, serif">
                  {step.title}
                </Text>
                <Text size="sm" c="dimmed" maw={300}>
                  {step.desc}
                </Text>
              </Stack>
            ))}
          </SimpleGrid>
        </Stack>

        {/* PROVIDER CTA BAND */}
        <Group
          className={styles.providerBand}
          justify="space-between"
          wrap="wrap"
          gap="md"
          p="xl"
        >
          <Group gap="md" wrap="nowrap">
            <IconBuildingStore size={32} color="var(--gold)" />
            <div>
              <Text fw={600} ff="var(--font-display), Georgia, serif" fz="xl">
                {t('providerTitle')}
              </Text>
              <Text size="sm" style={{ opacity: 0.8 }}>
                {t('providerLead')}
              </Text>
            </div>
          </Group>
          <ProviderCtaButton />
        </Group>
      </Stack>
    </Container>
  );
}
