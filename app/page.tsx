import Link from 'next/link';
import { useTranslations } from 'next-intl';
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

export default function HomePage() {
  const t = useTranslations('home');
  const td = useTranslations('discover');

  const features = [
    { icon: IconMapPin, title: t('feat1Title'), desc: t('feat1Desc') },
    { icon: IconCalendarCheck, title: t('feat2Title'), desc: t('feat2Desc') },
    { icon: IconUserPlus, title: t('feat3Title'), desc: t('feat3Desc') },
  ];

  return (
    <Container size="lg" py={64}>
      <Stack gap={48}>
        <Stack align="center" gap="lg" ta="center">
          <Badge
            size="lg"
            variant="light"
            leftSection={<IconMapPin size={14} />}
            radius="sm"
          >
            {t('heroBadge')}
          </Badge>

          <Title order={1} fz={{ base: 32, sm: 44 }} ta="center">
            {t('heroTitle')}
          </Title>

          <Text fz="lg" c="dimmed" maw={560}>
            {t('heroLead')}
          </Text>

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
          {features.map((f) => (
            <Card key={f.title} withBorder radius="md" padding="lg">
              <ThemeIcon size={44} radius="md" variant="light" mb="sm">
                <f.icon size={24} />
              </ThemeIcon>
              <Text fw={600} mb={4}>
                {f.title}
              </Text>
              <Text size="sm" c="dimmed">
                {f.desc}
              </Text>
            </Card>
          ))}
        </SimpleGrid>

        <Card withBorder radius="md" padding="xl" bg="var(--mantine-color-default-hover)">
          <Group justify="space-between" wrap="wrap" gap="md">
            <Group gap="md" wrap="nowrap">
              <ThemeIcon size={44} radius="md" variant="filled">
                <IconBuildingStore size={24} />
              </ThemeIcon>
              <div>
                <Text fw={600}>{t('providerTitle')}</Text>
                <Text size="sm" c="dimmed">
                  {t('providerLead')}
                </Text>
              </div>
            </Group>
            <Button
              component={Link}
              href="/register"
              variant="default"
              rightSection={<IconArrowRight size={18} />}
            >
              {t('providerCta')}
            </Button>
          </Group>
        </Card>
      </Stack>
    </Container>
  );
}
