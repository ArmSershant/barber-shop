import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { bookingReminderEmail, rebookingEmail } from '@/lib/email-templates';
import { sendSms } from '@/lib/sms';
import { bookingReminderSms } from '@/lib/sms-templates';

const REBOOK_AFTER_DAYS = 28;
const REBOOK_WINDOW_DAYS = 45; // don't nudge bookings older than this (avoids backfill spam)

// Sends reminder emails for confirmed bookings starting within the next 24h
// that haven't been reminded yet. Triggered by Vercel Cron (see vercel.json)
// or any external pinger. Protected by CRON_SECRET if set.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 3600_000);

  const due = await prisma.booking.findMany({
    where: {
      status: 'confirmed',
      reminderSentAt: null,
      startsAt: { gt: now, lte: in24h },
    },
    take: 200,
    select: {
      id: true,
      startsAt: true,
      guestName: true,
      guestEmail: true,
      guestPhone: true,
      customer: { select: { fullName: true, email: true, phone: true } },
      barber: { select: { displayName: true, timezone: true } },
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barber-shop-alpha-two.vercel.app';
  let sent = 0;

  for (const b of due) {
    const email = b.customer?.email ?? b.guestEmail ?? null;
    if (email) {
      const when = new Intl.DateTimeFormat('hy', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: b.barber.timezone,
      }).format(b.startsAt);
      const { subject, html } = bookingReminderEmail(undefined, {
        customerName: b.customer?.fullName ?? b.guestName ?? '',
        barberName: b.barber.displayName,
        when,
        appUrl,
      });
      await sendEmail({ to: email, subject, html });
      sent += 1;
    }

    const phone = b.customer?.phone ?? b.guestPhone ?? null;
    if (phone) {
      const when = new Intl.DateTimeFormat('hy', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: b.barber.timezone,
      }).format(b.startsAt);
      void sendSms({ to: phone, body: bookingReminderSms(undefined, { barberName: b.barber.displayName, when }) });
    }

    // Mark as reminded regardless (avoid retry storms; no email = nothing to resend).
    await prisma.booking.update({ where: { id: b.id }, data: { reminderSentAt: now } });
  }

  // --- Rebooking nudges: completed visits ~4 weeks ago, not yet nudged ---
  const rebookFrom = new Date(now.getTime() - REBOOK_WINDOW_DAYS * 24 * 3600_000);
  const rebookTo = new Date(now.getTime() - REBOOK_AFTER_DAYS * 24 * 3600_000);

  const rebookDue = await prisma.booking.findMany({
    where: {
      status: 'completed',
      rebookNudgeSentAt: null,
      startsAt: { gte: rebookFrom, lte: rebookTo },
    },
    take: 200,
    select: {
      id: true,
      barberId: true,
      startsAt: true,
      customerUserId: true,
      guestName: true,
      guestEmail: true,
      customer: { select: { fullName: true, email: true } },
      barber: { select: { displayName: true, slug: true } },
    },
  });

  let rebooked = 0;
  for (const b of rebookDue) {
    // Skip if the customer already returned to this barber since (more recent booking).
    const returned = await prisma.booking.findFirst({
      where: {
        barberId: b.barberId,
        startsAt: { gt: b.startsAt },
        ...(b.customerUserId
          ? { customerUserId: b.customerUserId }
          : b.guestEmail
            ? { guestEmail: b.guestEmail }
            : { id: '__none__' }),
      },
      select: { id: true },
    });

    const email = b.customer?.email ?? b.guestEmail ?? null;
    if (!returned && email) {
      const { subject, html } = rebookingEmail(undefined, {
        customerName: b.customer?.fullName ?? b.guestName ?? '',
        barberName: b.barber.displayName,
        when: '',
        appUrl: `${appUrl}/barbers/${b.barber.slug}`,
      });
      await sendEmail({ to: email, subject, html });
      rebooked += 1;
    }
    await prisma.booking.update({ where: { id: b.id }, data: { rebookNudgeSentAt: now } });
  }

  return Response.json({
    ok: true,
    reminders: { processed: due.length, emailed: sent },
    rebooking: { processed: rebookDue.length, emailed: rebooked },
  });
}
