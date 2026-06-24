import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconMapPin,
  IconCalendarCheck,
  IconUserPlus,
  IconArrowRight,
  IconBuildingStore,
} from '@tabler/icons-react';
import { HeroSearch } from '@/components/HeroSearch';
import { DistrictChips } from '@/components/DistrictChips';
import { ProviderCtaButton } from '@/components/ProviderCtaButton';
import { listDistricts } from '@/lib/queries/districts';

export default async function HomePage() {
  const t = await getTranslations('home');
  const td = await getTranslations('discover');
  const locale = await getLocale();
  // Don't fail the build if the DB is unreachable at prerender time (e.g. CI).
  const districts = await listDistricts().catch(() => []);

  const features = [
    { icon: IconMapPin, title: t('feat1Title'), desc: t('feat1Desc') },
    { icon: IconCalendarCheck, title: t('feat2Title'), desc: t('feat2Desc') },
    { icon: IconUserPlus, title: t('feat3Title'), desc: t('feat3Desc') },
  ];

  return (
    <Container size="lg" py={64}>
      <Stack gap={48}>
        <Stack align="center" gap="lg" ta="center" className="animate-in">
          <Badge
            size="lg"
            variant="outline"
            color="gold"
            leftSection={<IconMapPin size={14} />}
            radius="xs"
          >
            {t('heroBadge')}
          </Badge>

          <Title order={1} fz={{ base: 32, sm: 44 }} ta="center">
            {t('heroTitle')}
          </Title>

          <Text fz="lg" c="dimmed" maw={560}>
            {t('heroLead')}
          </Text>

          <HeroSearch />

          <Group justify="center" mt="xs">
            <Button
              component={Link}
              href="/barbers"
              size="md"
              rightSection={<IconArrowRight size={18} />}
            >
              {td('browseBarbers')}
            </Button>
            <Button
              component={Link}
              href="/shops"
              size="md"
              variant="light"
              leftSection={<IconBuildingStore size={18} />}
            >
              {td('browseShops')}
            </Button>
          </Group>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
          {features.map((f, i) => (
            <Card
              key={f.title}
              withBorder
              radius="xs"
              padding="lg"
              className="hoverLift offsetShadow animate-in"
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
            >
              <ThemeIcon size={44} radius="xs" variant="outline" color="gold" mb="sm">
                <f.icon size={24} />
              </ThemeIcon>
              <Text fw={600} mb={4} ff="var(--font-display), Georgia, serif" fz="lg">
                {f.title}
              </Text>
              <Text size="sm" c="dimmed">
                {f.desc}
              </Text>
            </Card>
          ))}
        </SimpleGrid>

        {districts.length > 0 && (
          <Stack gap="sm" align="center">
            <Title order={3} ta="center">
              {t('browseByDistrict')}
            </Title>
            <DistrictChips districts={districts} locale={locale} />
          </Stack>
        )}

        <Card
          withBorder
          radius="xs"
          padding="xl"
          className="offsetShadow animate-in"
          style={{ animationDelay: '0.35s', background: 'var(--surf2)' }}
        >
          <Group justify="space-between" wrap="wrap" gap="md">
            <Group gap="md" wrap="nowrap">
              <ThemeIcon size={44} radius="xs" variant="filled" color="espresso">
                <IconBuildingStore size={24} />
              </ThemeIcon>
              <div>
                <Text fw={600} ff="var(--font-display), Georgia, serif" fz="xl">
                  {t('providerTitle')}
                </Text>
                <Text size="sm" c="dimmed">
                  {t('providerLead')}
                </Text>
              </div>
            </Group>
            <ProviderCtaButton />
          </Group>
        </Card>
      </Stack>
    </Container>
  );
}
