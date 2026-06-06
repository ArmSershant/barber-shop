'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Anchor, Button, Group, Text } from '@mantine/core';
import { api, useMeQuery, useLogoutMutation } from '@/lib/store/api';
import { useAppDispatch } from '@/lib/store/hooks';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ColorSchemeToggle } from './ColorSchemeToggle';
import { NotificationsBell } from './NotificationsBell';
import styles from './SiteHeader.module.scss';

export function SiteHeader() {
  const t = useTranslations('header');
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data, isLoading } = useMeQuery();
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();
  const user = data?.user ?? null;
  const isProvider =
    !!user && (user.roles.includes('shop_owner') || user.roles.includes('barber'));
  const isAdmin = !!user && user.roles.includes('admin');

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
      <div className={styles.inner}>
        <Anchor component={Link} href="/" fw={700} fz="lg" underline="never" c="inherit">
          Barber-Shop
        </Anchor>

        {user && (
          <nav className={styles.centerNav}>
            {isProvider ? (
              <>
                <Anchor component={Link} href="/dashboard" c="inherit" fz="sm">
                  {t('dashboard')}
                </Anchor>
                <Anchor component={Link} href="/dashboard/bookings" c="inherit" fz="sm">
                  {t('bookings')}
                </Anchor>
              </>
            ) : (
              <Anchor component={Link} href="/bookings" c="inherit" fz="sm">
                {t('myBookings')}
              </Anchor>
            )}
            {isAdmin && (
              <Anchor component={Link} href="/admin" c="inherit" fz="sm">
                {t('admin')}
              </Anchor>
            )}
          </nav>
        )}

        <Group gap="sm">
          {isLoading ? null : user ? (
            <>
              <Text c="dimmed" fz="sm">
                {t('greeting', { name: user.fullName })}
              </Text>
              <LanguageSwitcher />
              <ColorSchemeToggle />
              <NotificationsBell />
              <Button size="xs" variant="light" onClick={onLogout} loading={loggingOut}>
                {t('logout')}
              </Button>
            </>
          ) : (
            <>
              <LanguageSwitcher />
              <ColorSchemeToggle />
              <Anchor component={Link} href="/login" c="inherit" fz="sm">
                {t('login')}
              </Anchor>
              <Button component={Link} href="/register" size="xs">
                {t('signup')}
              </Button>
            </>
          )}
        </Group>
      </div>
    </header>
  );
}
