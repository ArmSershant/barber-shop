import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { bookingReminderEmail } from '@/lib/email-templates';

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
      customer: { select: { fullName: true, email: true } },
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
    // Mark as reminded regardless (avoid retry storms; no email = nothing to resend).
    await prisma.booking.update({ where: { id: b.id }, data: { reminderSentAt: now } });
  }

  return Response.json({ ok: true, processed: due.length, emailed: sent });
}
