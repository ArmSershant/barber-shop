import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { sendEmail } from '@/lib/email';
import { bookingConfirmationEmail } from '@/lib/email-templates';
import { sendSms } from '@/lib/sms';
import { bookingConfirmationSms } from '@/lib/sms-templates';
import { buildIcs } from '@/lib/ics';

type Params = { params: Promise<{ id: string }> };

/** Provider accepts a pending (requested) booking → confirmed, and notifies the customer. */
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        startsAt: true,
        endsAt: true,
        manageToken: true,
        customerUserId: true,
        guestName: true,
        guestEmail: true,
        guestPhone: true,
        customer: { select: { fullName: true, email: true, phone: true } },
        barber: {
          select: {
            slug: true,
            displayName: true,
            timezone: true,
            userId: true,
            shop: { select: { ownerUserId: true } },
          },
        },
      },
    });
    if (!booking) throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');

    const isProvider =
      booking.barber.userId === userId || booking.barber.shop?.ownerUserId === userId;
    if (!isProvider) throw new HttpError(403, 'FORBIDDEN', 'Not your booking.');
    if (booking.status !== 'requested') {
      throw new HttpError(409, 'NOT_REQUESTED', 'Only pending bookings can be accepted.');
    }

    await prisma.booking.update({ where: { id }, data: { status: 'confirmed' } });

    // Notify the customer their booking is now confirmed (best-effort).
    const customerName = booking.customer?.fullName ?? booking.guestName ?? 'Customer';
    const email = booking.customer?.email ?? booking.guestEmail ?? null;
    const phone = booking.customer?.phone ?? booking.guestPhone ?? null;
    const locale = (await cookies()).get('NEXT_LOCALE')?.value;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barber-shop.am';
    const when = new Intl.DateTimeFormat(locale ?? 'hy', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: booking.barber.timezone,
    }).format(booking.startsAt);

    try {
      if (booking.customerUserId) {
        await prisma.notification.create({
          data: {
            userId: booking.customerUserId,
            type: 'booking_confirmed',
            channel: 'inapp',
            payload: { bookingId: id, barberName: booking.barber.displayName, startsAt: booking.startsAt.toISOString() },
          },
        });
      }
      if (email) {
        const { subject, html } = bookingConfirmationEmail(locale, {
          customerName,
          barberName: booking.barber.displayName,
          when,
          appUrl,
          manageUrl: booking.manageToken
            ? `${appUrl}/manage?token=${encodeURIComponent(booking.manageToken)}`
            : undefined,
        });
        const ics = buildIcs({
          uid: `${booking.id}@barber-shop.am`,
          start: booking.startsAt,
          end: booking.endsAt,
          summary: `${booking.barber.displayName} — Barber-Shop`,
          url: `${appUrl}/barbers/${booking.barber.slug}`,
        });
        void sendEmail({
          to: email,
          subject,
          html,
          attachments: [{ filename: 'booking.ics', content: Buffer.from(ics).toString('base64') }],
        });
      }
      if (phone) {
        void sendSms({ to: phone, body: bookingConfirmationSms(locale, { barberName: booking.barber.displayName, when }) });
      }
    } catch (notifyErr) {
      console.error('Failed to send acceptance notifications:', notifyErr);
    }

    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
