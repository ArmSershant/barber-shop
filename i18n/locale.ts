'use server';

import { cookies } from 'next/headers';
import { isLocale, LOCALE_COOKIE, type Locale } from './config';

// Persist the chosen locale in a cookie. The caller refreshes the route so
// Server Components re-render with the new messages.
export async function setLocale(locale: Locale) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
}
