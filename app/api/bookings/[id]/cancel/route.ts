import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { getCurrentUser } from '@/lib/auth/session';
import { cancelBookingSchema } from '@/lib/validation/booking';

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
        barber: { select: { userId: true, shop: { select: { ownerUserId: true } } } },
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
    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
