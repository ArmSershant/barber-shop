'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setLocale } from '@/i18n/locale';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';
import styles from './LanguageSwitcher.module.scss';

export function LanguageSwitcher() {
  const active = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const choose = (next: Locale) => {
    if (next === active) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh(); // re-render Server Components with the new locale
    });
  };

  return (
    <div className={styles.group} role="group" aria-label="Language">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          className={`${styles.flagBtn} ${l === active ? styles.active : ''}`}
          onClick={() => choose(l)}
          disabled={pending}
          aria-pressed={l === active}
          title={localeNames[l]}
        >
          <span className={`fi fi-${localeFlags[l]}`} aria-hidden="true" />
          <span className={styles.srOnly}>{localeNames[l]}</span>
        </button>
      ))}
    </div>
  );
}
