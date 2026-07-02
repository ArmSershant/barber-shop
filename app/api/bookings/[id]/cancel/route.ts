import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { getCurrentUser } from '@/lib/auth/session';
import { cancelBookingSchema } from '@/lib/validation/booking';
import { sendEmail } from '@/lib/email';
import { bookingCancelledEmail } from '@/lib/email-templates';
import { refundRedemptionForBooking } from '@/lib/loyalty';
import { notifyWaitlistForDay } from '@/lib/waitlist';

type Params = { params: Promise<{ id: string }> };

// Cancel a booking: the customer who made it, the provider, or a guest holding
// the manage token.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = cancelBookingSchema.parse(await req.json().catch(() => ({})));

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        customerUserId: true,
        manageToken: true,
        status: true,
        startsAt: true,
        barberId: true,
        guestName: true,
        guestEmail: true,
        customer: { select: { fullName: true, email: true, phone: true } },
        barber: {
          select: {
            userId: true,
            displayName: true,
            slug: true,
            timezone: true,
            shop: { select: { ownerUserId: true } },
          },
        },
      },
    });
    if (!booking) throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');

    const user = await getCurrentUser();
    let cancelledBy: 'customer' | 'provider' | null = null;
    if (user && booking.customerUserId === user.userId) cancelledBy = 'customer';
    else if (
      user &&
      (booking.barber.userId === user.userId || booking.barber.shop?.ownerUserId === user.userId)
    )
      cancelledBy = 'provider';
    else if (body.token && booking.manageToken && body.token === booking.manageToken)
      cancelledBy = 'customer';

    if (!cancelledBy) throw new HttpError(403, 'FORBIDDEN', 'Not allowed to cancel this booking.');

    if (booking.status === 'cancelled') return ok({ ok: true }); // idempotent
    if (booking.status === 'completed') {
      throw new HttpError(409, 'ALREADY_COMPLETED', 'Cannot cancel a completed booking.');
    }

    await prisma.booking.update({
      where: { id },
      data: { status: 'cancelled', cancelReason: body.reason ?? null, cancelledBy },
    });

    // Return any loyalty points spent on this booking. Best-effort.
    try {
      await refundRedemptionForBooking(id);
    } catch (refundErr) {
      console.error('Failed to refund loyalty redemption:', refundErr);
    }

    // A slot just freed up — notify anyone waitlisted for that day. Best-effort.
    try {
      await notifyWaitlistForDay(
        {
          id: booking.barberId,
          displayName: booking.barber.displayName,
          slug: booking.barber.slug,
          timezone: booking.barber.timezone,
        },
        booking.startsAt,
      );
    } catch (waitlistErr) {
      console.error('Failed to notify waitlist:', waitlistErr);
    }

    // Notify the other side. Best-effort.
    try {
      const payload = {
        bookingId: booking.id,
        customerName: booking.customer?.fullName ?? booking.guestName ?? '',
        startsAt: booking.startsAt.toISOString(),
      };
      if (cancelledBy === 'customer') {
        const recipientUserId = booking.barber.userId ?? booking.barber.shop?.ownerUserId ?? null;
        if (recipientUserId) {
          await prisma.notification.create({
            data: { userId: recipientUserId, type: 'booking_cancelled', channel: 'inapp', payload },
          });
        }
      } else if (cancelledBy === 'provider' && booking.customerUserId) {
        await prisma.notification.create({
          data: { userId: booking.customerUserId, type: 'booking_cancelled', channel: 'inapp', payload },
        });
      }
    } catch (notifyErr) {
      console.error('Failed to write cancel notification:', notifyErr);
    }

    // When the provider cancels, email the customer (registered or guest).
    if (cancelledBy === 'provider') {
      const email = booking.customer?.email ?? booking.guestEmail ?? null;
      if (email) {
        const { subject, html } = bookingCancelledEmail(undefined, {
          customerName: booking.customer?.fullName ?? booking.guestName ?? '',
          barberName: booking.barber.displayName,
          when: new Intl.DateTimeFormat('hy', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: booking.barber.timezone,
          }).format(booking.startsAt),
          appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://barber-shop-alpha-two.vercel.app',
        });
        void sendEmail({ to: email, subject, html });
      }
    }

    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
