'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setLocale } from '@/i18n/locale';
import { locales, localeNames, type Locale } from '@/i18n/config';
import styles from './LanguageSwitcher.module.scss';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      className={styles.select}
      value={locale}
      disabled={pending}
      aria-label="Language"
      onChange={(e) => {
        const next = e.target.value as Locale;
        startTransition(async () => {
          await setLocale(next);
          router.refresh(); // re-render Server Components with the new locale
        });
      }}
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {localeNames[l]}
        </option>
      ))}
    </select>
  );
}
