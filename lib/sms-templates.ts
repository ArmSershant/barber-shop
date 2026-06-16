// Short, translated SMS bodies. Locale falls back to Armenian.
type Locale = 'hy' | 'en' | 'ru';

function pick(locale?: string): Locale {
  return locale === 'en' || locale === 'ru' ? locale : 'hy';
}

export function bookingConfirmationSms(
  locale: string | undefined,
  d: { barberName: string; when: string },
): string {
  return {
    hy: `Ձեր ամրագրումը հաստատված է՝ ${d.barberName}, ${d.when}: Barber-Shop`,
    en: `Booking confirmed: ${d.barberName}, ${d.when}. Barber-Shop`,
    ru: `Запись подтверждена: ${d.barberName}, ${d.when}. Barber-Shop`,
  }[pick(locale)];
}

export function bookingReminderSms(
  locale: string | undefined,
  d: { barberName: string; when: string },
): string {
  return {
    hy: `Հիշեցում՝ ${d.barberName}, ${d.when}: Barber-Shop`,
    en: `Reminder: ${d.barberName}, ${d.when}. Barber-Shop`,
    ru: `Напоминание: ${d.barberName}, ${d.when}. Barber-Shop`,
  }[pick(locale)];
}
