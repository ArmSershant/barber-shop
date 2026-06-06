// Self-contained, translated email templates (no next-intl — these run outside
// a request context, e.g. in the cron job). Locale falls back to Armenian.

type Locale = 'hy' | 'en' | 'ru';

export interface BookingEmailData {
  customerName: string;
  barberName: string;
  when: string; // pre-formatted date/time string
  appUrl: string;
}

const COPY: Record<
  Locale,
  {
    confirmSubject: string;
    confirmTitle: string;
    cancelSubject: string;
    cancelTitle: string;
    reminderSubject: string;
    reminderTitle: string;
    withLabel: string;
    whenLabel: string;
    cta: string;
    footer: string;
  }
> = {
  hy: {
    confirmSubject: 'Ձեր ամրագրումը հաստատված է',
    confirmTitle: 'Ամրագրումը հաստատված է',
    cancelSubject: 'Ձեր ամրագրումը չեղարկվել է',
    cancelTitle: 'Ամրագրումը չեղարկվել է',
    reminderSubject: 'Հիշեցում Ձեր ամրագրման մասին',
    reminderTitle: 'Մոտալուտ այց',
    withLabel: 'Վարսավիր',
    whenLabel: 'Ժամ',
    cta: 'Բացել Barber-Shop',
    footer: 'Barber-Shop — Երևան',
  },
  en: {
    confirmSubject: 'Your booking is confirmed',
    confirmTitle: 'Booking confirmed',
    cancelSubject: 'Your booking was cancelled',
    cancelTitle: 'Booking cancelled',
    reminderSubject: 'Reminder about your booking',
    reminderTitle: 'Upcoming appointment',
    withLabel: 'Barber',
    whenLabel: 'When',
    cta: 'Open Barber-Shop',
    footer: 'Barber-Shop — Yerevan',
  },
  ru: {
    confirmSubject: 'Ваша запись подтверждена',
    confirmTitle: 'Запись подтверждена',
    cancelSubject: 'Ваша запись отменена',
    cancelTitle: 'Запись отменена',
    reminderSubject: 'Напоминание о записи',
    reminderTitle: 'Предстоящая запись',
    withLabel: 'Барбер',
    whenLabel: 'Когда',
    cta: 'Открыть Barber-Shop',
    footer: 'Barber-Shop — Ереван',
  },
};

function pickLocale(locale?: string): Locale {
  return locale === 'en' || locale === 'ru' ? locale : 'hy';
}

function layout(title: string, body: string, c: (typeof COPY)['en'], appUrl: string): string {
  return `
  <div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
    <h2 style="margin:0 0 16px">${title}</h2>
    ${body}
    <p style="margin:24px 0 0">
      <a href="${appUrl}" style="display:inline-block;background:#12b886;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px">${c.cta}</a>
    </p>
    <p style="margin:24px 0 0;color:#888;font-size:13px">${c.footer}</p>
  </div>`;
}

function detailRows(c: (typeof COPY)['en'], d: BookingEmailData): string {
  return `
    <p style="margin:4px 0"><strong>${c.withLabel}:</strong> ${d.barberName}</p>
    <p style="margin:4px 0"><strong>${c.whenLabel}:</strong> ${d.when}</p>`;
}

export function bookingConfirmationEmail(locale: string | undefined, d: BookingEmailData) {
  const c = COPY[pickLocale(locale)];
  return {
    subject: c.confirmSubject,
    html: layout(c.confirmTitle, detailRows(c, d), c, d.appUrl),
  };
}

export function bookingCancelledEmail(locale: string | undefined, d: BookingEmailData) {
  const c = COPY[pickLocale(locale)];
  return {
    subject: c.cancelSubject,
    html: layout(c.cancelTitle, detailRows(c, d), c, d.appUrl),
  };
}

export function bookingReminderEmail(locale: string | undefined, d: BookingEmailData) {
  const c = COPY[pickLocale(locale)];
  return {
    subject: c.reminderSubject,
    html: layout(c.reminderTitle, detailRows(c, d), c, d.appUrl),
  };
}
