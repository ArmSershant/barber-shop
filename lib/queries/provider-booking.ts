import { prisma } from '@/lib/db';
import { HttpError } from '@/lib/http';

/**
 * Load a booking and assert the current user is its provider (the barber's own
 * account or the shop owner), it's confirmed, and the appointment has started.
 * Used by the complete / no-show endpoints.
 */
export async function loadStartedProviderBooking(id: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      startsAt: true,
      barber: { select: { userId: true, shop: { select: { ownerUserId: true } } } },
    },
  });
  if (!booking) throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');

  const isProvider =
    booking.barber.userId === userId || booking.barber.shop?.ownerUserId === userId;
  if (!isProvider) throw new HttpError(403, 'FORBIDDEN', 'Not your booking.');

  if (booking.status !== 'confirmed') {
    throw new HttpError(409, 'NOT_CONFIRMED', 'Only confirmed bookings can be updated.');
  }
  if (booking.startsAt.getTime() > Date.now()) {
    throw new HttpError(409, 'NOT_STARTED', 'The appointment has not started yet.');
  }
  return booking;
}
