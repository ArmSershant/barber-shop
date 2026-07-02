import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { loadStartedProviderBooking } from '@/lib/queries/provider-booking';
import { sendEmail } from '@/lib/email';
import { reviewRequestEmail } from '@/lib/email-templates';
import { earnPointsForBooking } from '@/lib/loyalty';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    await loadStartedProviderBooking(id, userId);

    await prisma.booking.update({ where: { id }, data: { status: 'completed' } });

    // Accrue loyalty points — best-effort, never blocks completion.
    try {
      await earnPointsForBooking(id);
    } catch (pointsErr) {
      console.error('Failed to accrue loyalty points:', pointsErr);
    }

    // Nudge the customer to leave a review — best-effort, never blocks completion.
    try {
      const b = await prisma.booking.findUnique({
        where: { id },
        select: {
          customerUserId: true,
          guestName: true,
          guestEmail: true,
          customer: { select: { fullName: true, email: true } },
          barber: { select: { displayName: true, slug: true } },
        },
      });
      if (b) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barber-shop.am';
        if (b.customerUserId) {
          await prisma.notification.create({
            data: {
              userId: b.customerUserId,
              type: 'review_request',
              channel: 'inapp',
              payload: { bookingId: id, barberName: b.barber.displayName, barberSlug: b.barber.slug },
            },
          });
        }
        const email = b.customer?.email ?? b.guestEmail ?? null;
        if (email) {
          const { subject, html } = reviewRequestEmail(undefined, {
            customerName: b.customer?.fullName ?? b.guestName ?? '',
            barberName: b.barber.displayName,
            when: '',
            appUrl: `${appUrl}/bookings`,
          });
          await sendEmail({ to: email, subject, html });
        }
      }
    } catch (nudgeErr) {
      console.error('Failed to send review nudge:', nudgeErr);
    }

    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
