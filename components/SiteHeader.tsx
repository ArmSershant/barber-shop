'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Anchor, Button, Group, Text } from '@mantine/core';
import { useMeQuery, useLogoutMutation } from '@/lib/store/api';
import { LanguageSwitcher } from './LanguageSwitcher';
import styles from './SiteHeader.module.scss';

export function SiteHeader() {
  const t = useTranslations('header');
  const { data, isLoading } = useMeQuery();
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();
  const user = data?.user ?? null;

  return (
    <header className={styles.header}>
      <Group justify="space-between" px="md" py="sm">
        <Anchor component={Link} href="/" fw={700} fz="lg" underline="never" c="inherit">
          Barber-Shop
        </Anchor>

        <Group gap="sm">
          <LanguageSwitcher />
          {isLoading ? null : user ? (
            <>
              <Text c="dimmed" fz="sm">
                {t('greeting', { name: user.fullName })}
              </Text>
              <Button size="xs" variant="light" onClick={() => logout()} loading={loggingOut}>
                {t('logout')}
              </Button>
            </>
          ) : (
            <>
              <Anchor component={Link} href="/login" c="inherit" fz="sm">
                {t('login')}
              </Anchor>
              <Button component={Link} href="/register" size="xs">
                {t('signup')}
              </Button>
            </>
          )}
        </Group>
      </Group>
    </header>
  );
}
