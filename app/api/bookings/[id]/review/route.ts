import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { reviewSchema } from '@/lib/validation/review';

type Params = { params: Promise<{ id: string }> };

// Customer reviews their own completed booking (once). Recomputes the barber's
// rating aggregate in the same transaction.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    const { rating, comment } = reviewSchema.parse(await req.json());

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        customerUserId: true,
        barberId: true,
        status: true,
        barber: {
          select: { userId: true, slug: true, shop: { select: { ownerUserId: true } } },
        },
      },
    });
    if (!booking) throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
    if (booking.customerUserId !== userId) {
      throw new HttpError(403, 'FORBIDDEN', 'You can only review your own bookings.');
    }
    if (booking.status !== 'completed') {
      throw new HttpError(409, 'NOT_COMPLETED', 'Only completed bookings can be reviewed.');
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.review.create({
          data: {
            bookingId: booking.id,
            barberId: booking.barberId,
            customerUserId: userId,
            rating,
            comment,
          },
        });
        const agg = await tx.review.aggregate({
          where: { barberId: booking.barberId, isHidden: false },
          _avg: { rating: true },
          _count: true,
        });
        await tx.barber.update({
          where: { id: booking.barberId },
          data: {
            ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10,
            ratingCount: agg._count,
          },
        });
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new HttpError(409, 'ALREADY_REVIEWED', 'You already reviewed this booking.');
      }
      throw e;
    }

    // Notify the provider about the new review. Best-effort.
    try {
      const recipientUserId =
        booking.barber.userId ?? booking.barber.shop?.ownerUserId ?? null;
      if (recipientUserId && recipientUserId !== userId) {
        const reviewer = await prisma.user.findUnique({
          where: { id: userId },
          select: { fullName: true },
        });
        await prisma.notification.create({
          data: {
            userId: recipientUserId,
            type: 'review_received',
            channel: 'inapp',
            payload: {
              bookingId: booking.id,
              rating,
              customerName: reviewer?.fullName ?? '',
              barberSlug: booking.barber.slug,
            },
          },
        });
      }
    } catch (notifyErr) {
      console.error('Failed to write review notification:', notifyErr);
    }

    return ok({ ok: true }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
