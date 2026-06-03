export const locales = ['hy', 'en', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'hy';

export const localeNames: Record<Locale, string> = {
  hy: 'Հայերեն',
  en: 'English',
  ru: 'Русский',
};

export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
