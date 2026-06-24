import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Anchor, Container, Group, Text } from '@mantine/core';
import styles from './SiteFooter.module.scss';

export async function SiteFooter() {
  const t = await getTranslations('header');
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <Container size="lg">
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Text className={styles.wordmark}>barber-shop.am</Text>

          <Group gap="lg" wrap="wrap">
            <Anchor component={Link} href="/barbers" c="inherit" fz="sm" underline="never">
              {t('barbers')}
            </Anchor>
            <Anchor component={Link} href="/shops" c="inherit" fz="sm" underline="never">
              {t('shops')}
            </Anchor>
            <Anchor component={Link} href="/register" c="inherit" fz="sm" underline="never">
              {t('forBarbers')}
            </Anchor>
          </Group>

          <Text size="sm" c="dimmed">
            © {year} Barber-Shop · Yerevan
          </Text>
        </Group>
      </Container>
    </footer>
  );
}
