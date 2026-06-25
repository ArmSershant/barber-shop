'use client';

import type { ReactNode } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Anchor, Avatar, Badge, Burger, Button, Divider, Drawer, Group, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconUser,
  IconBuildingStore,
  IconScissors,
  IconLayoutDashboard,
  IconCalendarEvent,
  IconShieldCog,
  IconLogout,
  IconHeart,
} from '@tabler/icons-react';
import { api, useMeQuery, useLogoutMutation, useProviderMeQuery } from '@/lib/store/api';
import { useAppDispatch } from '@/lib/store/hooks';
import { Pole } from './Pole';
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
  const isCustomer = !!user && !isProvider && !isAdmin;
  // The dark "Admin" bar only applies inside the admin panel; elsewhere an admin
  // gets a normal header so they can browse the public site.
  const pathname = usePathname();
  const adminBar = isAdmin && (pathname?.startsWith('/admin') ?? false);
  const { data: provider } = useProviderMeQuery(undefined, { skip: !isProvider });

  const avatarSrc =
    user?.avatarUrl ?? provider?.barber?.photoUrl ?? provider?.shop?.logoUrl ?? undefined;
  const providerName = provider?.shop?.name ?? provider?.barber?.displayName ?? user?.fullName ?? '';

  const onLogout = async () => {
    closeDrawer();
    try {
      await logout().unwrap();
    } finally {
      dispatch(api.util.resetApiState());
      router.push('/');
    }
  };

  const NavLink = ({ href, icon, label }: { href: Route; icon: ReactNode; label: string }) => (
    <Anchor component={Link} href={href} c="inherit" fz="sm" underline="never" onClick={closeDrawer}>
      <Group gap={6} wrap="nowrap" className={styles.navLink}>
        {icon}
        <span>{label}</span>
      </Group>
    </Anchor>
  );

  const navLinks = (
    <>
      {isAdmin ? (
        <>
          <NavLink href="/barbers" icon={<IconUser size={16} />} label={t('barbers')} />
          <NavLink href="/shops" icon={<IconBuildingStore size={16} />} label={t('shops')} />
          <NavLink href="/admin" icon={<IconShieldCog size={16} />} label={t('admin')} />
        </>
      ) : isProvider ? (
        <>
          <NavLink href="/dashboard" icon={<IconLayoutDashboard size={16} />} label={t('dashboard')} />
          <NavLink href="/dashboard/bookings" icon={<IconCalendarEvent size={16} />} label={t('bookings')} />
        </>
      ) : isCustomer ? (
        <>
          <NavLink href="/barbers" icon={<IconUser size={16} />} label={t('barbers')} />
          <NavLink href="/shops" icon={<IconBuildingStore size={16} />} label={t('shops')} />
          <NavLink href="/bookings" icon={<IconCalendarEvent size={16} />} label={t('myBookings')} />
          <NavLink href="/favorites" icon={<IconHeart size={16} />} label={t('saved')} />
        </>
      ) : (
        <>
          <NavLink href="/barbers" icon={<IconUser size={16} />} label={t('barbers')} />
          <NavLink href="/shops" icon={<IconBuildingStore size={16} />} label={t('shops')} />
          <NavLink href="/register" icon={<IconScissors size={16} />} label={t('forBarbers')} />
        </>
      )}
    </>
  );

  // The account chip (right side / drawer): avatar + name, with an "Owner" tag for providers.
  const accountChip = user && (
    <Group gap={8} wrap="nowrap">
      <Avatar src={avatarSrc} size={30} radius={isProvider ? 'sm' : 'xl'} color="gold">
        {(providerName || user.fullName).charAt(0).toUpperCase()}
      </Avatar>
      {isProvider ? (
        <Group gap={6} wrap="nowrap">
          <Text fz="sm" lineClamp={1} maw={120}>
            {providerName}
          </Text>
          <Badge size="xs" variant="outline" color="gold" radius="xs">
            {t('owner')}
          </Badge>
        </Group>
      ) : (
        <Text className={styles.greet} lineClamp={1} maw={150}>
          {t('greeting', { name: user.fullName })}
        </Text>
      )}
    </Group>
  );

  return (
    <header className={`${styles.header} ${adminBar ? styles.adminHeader : ''}`}>
      <div className={styles.inner}>
        <Anchor component={Link} href="/" aria-label="Barber-Shop" className={styles.brand}>
          <Pole />
          {adminBar && <span className={styles.adminMark}>Admin</span>}
        </Anchor>

        {/* Desktop: centered nav */}
        <nav className={styles.centerNav}>{adminBar ? null : navLinks}</nav>

        {/* Desktop: right-side controls */}
        <Group gap="sm" visibleFrom="sm" wrap="nowrap">
          <LanguageSwitcher />
          <ColorSchemeToggle />
          {isLoading ? null : user ? (
            <>
              {!isAdmin && <NotificationsBell />}
              {adminBar ? (
                <Text fz="sm" lineClamp={1} maw={200} c="inherit">
                  {user.email}
                </Text>
              ) : (
                <Anchor component={Link} href="/account" c="inherit" underline="never">
                  {accountChip}
                </Anchor>
              )}
              <Button
                size="xs"
                variant={adminBar ? 'outline' : 'light'}
                color={adminBar ? 'gold' : 'ox'}
                onClick={onLogout}
                loading={loggingOut}
                leftSection={<IconLogout size={14} />}
              >
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

        {/* Mobile: burger */}
        <Group gap="xs" hiddenFrom="sm" wrap="nowrap">
          {user && !isAdmin && <NotificationsBell />}
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
              {adminBar ? (
                <Text fz="sm" c="dimmed">
                  {user.email}
                </Text>
              ) : (
                <Anchor component={Link} href="/account" c="inherit" underline="never" onClick={closeDrawer}>
                  {accountChip}
                </Anchor>
              )}
              <Stack gap="sm">{navLinks}</Stack>
              <Divider />
            </>
          )}
          {!user && <Stack gap="sm">{navLinks}</Stack>}

          <Group justify="space-between">
            <LanguageSwitcher />
            <ColorSchemeToggle />
          </Group>

          <Divider />

          {isLoading ? null : user ? (
            <Button variant="light" color="ox" onClick={onLogout} loading={loggingOut} leftSection={<IconLogout size={16} />} fullWidth>
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
