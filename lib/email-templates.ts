// Self-contained, translated email templates (no next-intl — these run outside
// a request context, e.g. in the cron job). Locale falls back to Armenian.

type Locale = 'hy' | 'en' | 'ru';

export interface BookingEmailData {
  customerName: string;
  barberName: string;
  when: string; // pre-formatted date/time string
  appUrl: string;
  manageUrl?: string; // guest manage link (optional)
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
    reviewSubject: string;
    reviewTitle: string;
    reviewBody: string;
    reviewCta: string;
    rebookSubject: string;
    rebookTitle: string;
    rebookBody: string;
    rebookCta: string;
    withLabel: string;
    whenLabel: string;
    cta: string;
    manageLink: string;
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
    reviewSubject: 'Ինչպե՞ս անցավ Ձեր այցը',
    reviewTitle: 'Թողե՛ք կարծիք',
    reviewBody: 'Շնորհակալություն այցի համար։ Կիսվե՛ք Ձեր կարծիքով՝ օգնելու ուրիշներին։',
    reviewCta: 'Թողնել կարծիք',
    rebookSubject: 'Ժամանակն է թարմացնել սանրվածքը',
    rebookTitle: 'Կարոտե՞լ եք թարմ սանրվածքը',
    rebookBody: 'Վերջին այցից որոշ ժամանակ է անցել։ Ամրագրե՛ք Ձեր հաջորդ այցը հիմա։',
    rebookCta: 'Ամրագրել կրկին',
    withLabel: 'Վարսավիր',
    whenLabel: 'Ժամ',
    cta: 'Բացել Barber-Shop',
    manageLink: 'Կառավարել ամրագրումը',
    footer: 'Barber-Shop — Երևան',
  },
  en: {
    confirmSubject: 'Your booking is confirmed',
    confirmTitle: 'Booking confirmed',
    cancelSubject: 'Your booking was cancelled',
    cancelTitle: 'Booking cancelled',
    reminderSubject: 'Reminder about your booking',
    reminderTitle: 'Upcoming appointment',
    reviewSubject: 'How was your visit?',
    reviewTitle: 'Leave a review',
    reviewBody: 'Thanks for your visit! Share how it went to help others choose.',
    reviewCta: 'Leave a review',
    rebookSubject: 'Time for a fresh cut',
    rebookTitle: 'Due for a trim?',
    rebookBody: "It's been a while since your last visit. Book your next appointment now.",
    rebookCta: 'Book again',
    withLabel: 'Barber',
    whenLabel: 'When',
    cta: 'Open Barber-Shop',
    manageLink: 'Manage your booking',
    footer: 'Barber-Shop — Yerevan',
  },
  ru: {
    confirmSubject: 'Ваша запись подтверждена',
    confirmTitle: 'Запись подтверждена',
    cancelSubject: 'Ваша запись отменена',
    cancelTitle: 'Запись отменена',
    reminderSubject: 'Напоминание о записи',
    reminderTitle: 'Предстоящая запись',
    reviewSubject: 'Как прошёл ваш визит?',
    reviewTitle: 'Оставьте отзыв',
    reviewBody: 'Спасибо за визит! Поделитесь впечатлениями, чтобы помочь другим.',
    reviewCta: 'Оставить отзыв',
    rebookSubject: 'Пора освежить стрижку',
    rebookTitle: 'Пора подстричься?',
    rebookBody: 'С вашего последнего визита прошло время. Запишитесь снова прямо сейчас.',
    rebookCta: 'Записаться снова',
    withLabel: 'Барбер',
    whenLabel: 'Когда',
    cta: 'Открыть Barber-Shop',
    manageLink: 'Управлять записью',
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
  const manage = d.manageUrl
    ? `<p style="margin:12px 0 0"><a href="${d.manageUrl}" style="color:#12b886">${c.manageLink}</a></p>`
    : '';
  return {
    subject: c.confirmSubject,
    html: layout(c.confirmTitle, detailRows(c, d) + manage, c, d.appUrl),
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

// `appUrl` here is the target link (e.g. /bookings for review, /barbers/<slug> to rebook).
export function reviewRequestEmail(locale: string | undefined, d: BookingEmailData) {
  const c = COPY[pickLocale(locale)];
  const body = `<p style="margin:0 0 8px">${c.reviewBody}</p>${detailRows(c, d)}`;
  return {
    subject: c.reviewSubject,
    html: layout(c.reviewTitle, body, { ...c, cta: c.reviewCta }, d.appUrl),
  };
}

export function rebookingEmail(locale: string | undefined, d: BookingEmailData) {
  const c = COPY[pickLocale(locale)];
  const body = `<p style="margin:0 0 8px">${c.rebookBody}</p><p style="margin:4px 0"><strong>${c.withLabel}:</strong> ${d.barberName}</p>`;
  return {
    subject: c.rebookSubject,
    html: layout(c.rebookTitle, body, { ...c, cta: c.rebookCta }, d.appUrl),
  };
}
