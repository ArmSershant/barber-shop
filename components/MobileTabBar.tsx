'use client';

import type { ReactNode } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  IconHome2,
  IconSearch,
  IconHeart,
  IconCalendarEvent,
  IconUser,
  IconBuildingStore,
  IconLayoutDashboard,
  IconLogin,
} from '@tabler/icons-react';
import { useMeQuery } from '@/lib/store/api';
import styles from './MobileTabBar.module.scss';

type Tab = { href: Route; icon: ReactNode; label: string };

/**
 * Mobile-only bottom tab bar (≤48em). Role-adaptive, mirroring the header roles.
 * Hidden inside the admin panel and on profile detail pages, where the sticky
 * "Book" bar owns the bottom of the screen.
 */
export function MobileTabBar() {
  const t = useTranslations('header');
  const pathname = usePathname() ?? '/';
  const { data } = useMeQuery();
  const user = data?.user ?? null;
  const isProvider = !!user && (user.roles.includes('shop_owner') || user.roles.includes('barber'));
  const isAdmin = !!user && user.roles.includes('admin');

  // The sticky Book bar lives on /barbers/[slug] and /shops/[slug]; the admin
  // panel has its own tabs. Don't stack a second bottom bar in either case.
  const isProfileDetail = /^\/(barbers|shops)\/[^/]+$/.test(pathname);
  if (isAdmin || isProfileDetail) return null;

  const tabs: Tab[] = isProvider
    ? [
        { href: '/', icon: <IconHome2 size={22} />, label: t('home') },
        { href: '/dashboard', icon: <IconLayoutDashboard size={22} />, label: t('dashboard') },
        { href: '/dashboard/bookings', icon: <IconCalendarEvent size={22} />, label: t('bookings') },
        { href: '/account', icon: <IconUser size={22} />, label: t('account') },
      ]
    : user
      ? [
          { href: '/', icon: <IconHome2 size={22} />, label: t('home') },
          { href: '/barbers', icon: <IconSearch size={22} />, label: t('search') },
          { href: '/favorites', icon: <IconHeart size={22} />, label: t('saved') },
          { href: '/bookings', icon: <IconCalendarEvent size={22} />, label: t('myBookings') },
          { href: '/account', icon: <IconUser size={22} />, label: t('account') },
        ]
      : [
          { href: '/', icon: <IconHome2 size={22} />, label: t('home') },
          { href: '/barbers', icon: <IconSearch size={22} />, label: t('barbers') },
          { href: '/shops', icon: <IconBuildingStore size={22} />, label: t('shops') },
          { href: '/login', icon: <IconLogin size={22} />, label: t('login') },
        ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Reserves layout height so the footer/content clears the fixed bar —
          only present when the bar itself renders. */}
      <div className={styles.spacer} aria-hidden />
      <nav className={styles.bar} aria-label="Primary">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`${styles.tab} ${isActive(tab.href) ? styles.active : ''}`}
          aria-current={isActive(tab.href) ? 'page' : undefined}
        >
          {tab.icon}
          <span className={styles.label}>{tab.label}</span>
        </Link>
      ))}
      </nav>
    </>
  );
}
