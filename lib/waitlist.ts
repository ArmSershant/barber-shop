import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Notify everyone waitlisted for a barber's local day that a slot has freed up
 * (e.g. after a cancellation). One notification per entry; marks them notified
 * so they aren't pinged again. Best-effort — never throws to the caller.
 */
export async function notifyWaitlistForDay(barber: {
  id: string;
  displayName: string;
  slug: string;
  timezone: string;
}, freedStartsAt: Date): Promise<number> {
  const date = dayjs(freedStartsAt).tz(barber.timezone).format('YYYY-MM-DD');
  const entries = await prisma.waitlistEntry.findMany({
    where: { barberId: barber.id, date, notifiedAt: null },
    select: { id: true, userId: true, user: { select: { email: true, fullName: true } } },
  });
  if (entries.length === 0) return 0;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barber-shop.am';
  const url = `${appUrl}/barbers/${barber.slug}`;

  for (const e of entries) {
    try {
      await prisma.notification.create({
        data: {
          userId: e.userId,
          type: 'waitlist_slot',
          channel: 'inapp',
          payload: { barberName: barber.displayName, barberSlug: barber.slug, date },
        },
      });
      if (e.user.email) {
        await sendEmail({
          to: e.user.email,
          subject: `A slot just opened with ${barber.displayName}`,
          html: `<p>Good news${e.user.fullName ? `, ${e.user.fullName}` : ''} — a time slot opened up with <strong>${barber.displayName}</strong> on ${date}.</p><p><a href="${url}">Book now</a> before it's taken.</p>`,
        });
      }
      await prisma.waitlistEntry.update({ where: { id: e.id }, data: { notifiedAt: new Date() } });
    } catch (err) {
      console.error('Failed to notify waitlist entry:', err);
    }
  }
  return entries.length;
}
