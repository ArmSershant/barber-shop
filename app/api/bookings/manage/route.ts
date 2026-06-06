import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';

// Public: a guest looks up their booking with the manage token from their link.
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) throw new HttpError(400, 'VALIDATION_ERROR', 'Missing token.');

    const booking = await prisma.booking.findFirst({
      where: { manageToken: token },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
        totalPriceAmd: true,
        guestName: true,
        services: { select: { typeSnapshot: true, nameSnapshot: true } },
        barber: { select: { displayName: true, slug: true } },
      },
    });
    if (!booking) throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');

    return ok({
      booking: {
        id: booking.id,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        status: booking.status,
        totalPriceAmd: booking.totalPriceAmd,
        guestName: booking.guestName,
        services: booking.services.map((s) => ({ type: s.typeSnapshot, name: s.nameSnapshot })),
        barber: booking.barber,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
