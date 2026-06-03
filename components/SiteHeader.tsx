'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
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
      <Link href="/" className={styles.brand}>
        Barber-Shop
      </Link>

      <nav className={styles.nav}>
        <LanguageSwitcher />
        {isLoading ? null : user ? (
          <>
            <span className={styles.hello}>{t('greeting', { name: user.fullName })}</span>
            <button className={styles.button} onClick={() => logout()} disabled={loggingOut}>
              {loggingOut ? t('loggingOut') : t('logout')}
            </button>
          </>
        ) : (
          <>
            <Link href="/login">{t('login')}</Link>
            <Link href="/register" className={styles.cta}>
              {t('signup')}
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
