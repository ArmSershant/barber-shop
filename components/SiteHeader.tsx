'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Anchor, Button, Group, Text } from '@mantine/core';
import { api, useMeQuery, useLogoutMutation } from '@/lib/store/api';
import { useAppDispatch } from '@/lib/store/hooks';
import { LanguageSwitcher } from './LanguageSwitcher';
import styles from './SiteHeader.module.scss';

export function SiteHeader() {
  const t = useTranslations('header');
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data, isLoading } = useMeQuery();
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();
  const user = data?.user ?? null;

  const onLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      // Clear all cached data so the header (and any page) reflect logout immediately.
      dispatch(api.util.resetApiState());
      router.push('/');
    }
  };

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
              {(user.roles.includes('shop_owner') || user.roles.includes('barber')) && (
                <Anchor component={Link} href="/dashboard" c="inherit" fz="sm">
                  {t('dashboard')}
                </Anchor>
              )}
              <Text c="dimmed" fz="sm">
                {t('greeting', { name: user.fullName })}
              </Text>
              <Button size="xs" variant="light" onClick={onLogout} loading={loggingOut}>
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
