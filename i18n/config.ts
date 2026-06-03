export const locales = ['hy', 'en', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'hy';

export const localeNames: Record<Locale, string> = {
  hy: 'Հայերեն',
  en: 'English',
  ru: 'Русский',
};

// ISO country codes for flag-icons (language != country; en uses the GB flag by convention).
export const localeFlags: Record<Locale, string> = {
  hy: 'am',
  en: 'gb',
  ru: 'ru',
};

export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
