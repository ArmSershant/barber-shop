'use client';

import Link from 'next/link';
import { useMeQuery, useLogoutMutation } from '@/lib/store/api';
import styles from './SiteHeader.module.scss';

export function SiteHeader() {
  const { data, isLoading } = useMeQuery();
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();
  const user = data?.user ?? null;

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        Barber-Shop
      </Link>

      <nav className={styles.nav}>
        {isLoading ? null : user ? (
          <>
            <span className={styles.hello}>Hi, {user.fullName}</span>
            <button className={styles.button} onClick={() => logout()} disabled={loggingOut}>
              {loggingOut ? 'Logging out…' : 'Log out'}
            </button>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/register" className={styles.cta}>
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
