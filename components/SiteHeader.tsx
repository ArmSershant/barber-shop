'use client';

import type { ReactNode } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Anchor, Avatar, Burger, Button, Divider, Drawer, Group, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconScissors,
  IconLayoutDashboard,
  IconCalendarEvent,
  IconCalendarHeart,
  IconShieldCog,
  IconLogout,
} from '@tabler/icons-react';
import { api, useMeQuery, useLogoutMutation, useProviderMeQuery } from '@/lib/store/api';
import { useAppDispatch } from '@/lib/store/hooks';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ColorSchemeToggle } from './ColorSchemeToggle';
import { NotificationsBell } from './NotificationsBell';
import styles from './SiteHeader.module.scss';

export function SiteHeader() {
  const t = useTranslations('header');
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const { data, isLoading } = useMeQuery();
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();
  const user = data?.user ?? null;
  const isProvider =
    !!user && (user.roles.includes('shop_owner') || user.roles.includes('barber'));
  const isAdmin = !!user && user.roles.includes('admin');
  const { data: provider } = useProviderMeQuery(undefined, { skip: !isProvider });

  // Account avatar, falling back to the provider's barber photo / shop logo.
  const avatarSrc =
    user?.avatarUrl ?? provider?.barber?.photoUrl ?? provider?.shop?.logoUrl ?? undefined;

  const onLogout = async () => {
    closeDrawer();
    try {
      await logout().unwrap();
    } finally {
      // Clear all cached data so the header (and any page) reflect logout immediately.
      dispatch(api.util.resetApiState());
      router.push('/');
    }
  };

  const NavLink = ({
    href,
    icon,
    label,
  }: {
    href: Route;
    icon: ReactNode;
    label: string;
  }) => (
    <Anchor
      component={Link}
      href={href}
      c="inherit"
      fz="sm"
      underline="never"
      onClick={closeDrawer}
    >
      <Group gap={6} wrap="nowrap" className={styles.navLink}>
        {icon}
        <span>{label}</span>
      </Group>
    </Anchor>
  );

  const navLinks = (
    <>
      {isProvider ? (
        <>
          <NavLink href="/dashboard" icon={<IconLayoutDashboard size={16} />} label={t('dashboard')} />
          <NavLink href="/dashboard/bookings" icon={<IconCalendarEvent size={16} />} label={t('bookings')} />
        </>
      ) : (
        <NavLink href="/bookings" icon={<IconCalendarHeart size={16} />} label={t('myBookings')} />
      )}
      {isAdmin && <NavLink href="/admin" icon={<IconShieldCog size={16} />} label={t('admin')} />}
    </>
  );

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Anchor
          component={Link}
          href="/"
          fw={700}
          fz="lg"
          underline="never"
          c="inherit"
          className={styles.brand}
        >
          <IconScissors size={20} stroke={2} />
          Barber-Shop
        </Anchor>

        {/* Desktop: centered nav */}
        {user && <nav className={styles.centerNav}>{navLinks}</nav>}

        {/* Desktop: right-side controls */}
        <Group gap="sm" visibleFrom="sm" wrap="nowrap">
          {isLoading ? null : user ? (
            <>
              <Anchor component={Link} href="/account" c="inherit" underline="never">
                <Group gap={6} wrap="nowrap">
                  <Avatar src={avatarSrc} size={28} radius="xl" color="brand">
                    {user.fullName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Text fz="sm" lineClamp={1} maw={130}>
                    {user.fullName}
                  </Text>
                </Group>
              </Anchor>
              <LanguageSwitcher />
              <ColorSchemeToggle />
              <NotificationsBell />
              <Button size="xs" variant="light" onClick={onLogout} loading={loggingOut} leftSection={<IconLogout size={14} />}>
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

        {/* Mobile: burger */}
        <Group gap="xs" hiddenFrom="sm" wrap="nowrap">
          {user && <NotificationsBell />}
          <Burger opened={drawerOpened} onClick={toggleDrawer} size="sm" aria-label="Menu" />
        </Group>
      </div>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        position="right"
        size="78%"
        title="Barber-Shop"
        hiddenFrom="sm"
        zIndex={1000}
      >
        <Stack gap="lg">
          {user && (
            <>
              <Anchor component={Link} href="/account" c="inherit" underline="never" onClick={closeDrawer}>
                <Group gap="sm" wrap="nowrap">
                  <Avatar src={avatarSrc} size={36} radius="xl" color="brand">
                    {user.fullName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Text fw={500}>{user.fullName}</Text>
                </Group>
              </Anchor>
              <Stack gap="sm">{navLinks}</Stack>
              <Divider />
            </>
          )}

          <Group justify="space-between">
            <LanguageSwitcher />
            <ColorSchemeToggle />
          </Group>

          <Divider />

          {isLoading ? null : user ? (
            <Button variant="light" onClick={onLogout} loading={loggingOut} leftSection={<IconLogout size={16} />} fullWidth>
              {t('logout')}
            </Button>
          ) : (
            <Stack gap="sm">
              <Button component={Link} href="/login" variant="default" onClick={closeDrawer} fullWidth>
                {t('login')}
              </Button>
              <Button component={Link} href="/register" onClick={closeDrawer} fullWidth>
                {t('signup')}
              </Button>
            </Stack>
          )}
        </Stack>
      </Drawer>
    </header>
  );
}
