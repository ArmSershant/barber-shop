import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { getCurrentUser } from '@/lib/auth/session';
import { getAvailableSlots } from '@/lib/queries/availability';
import { createBookingSchema } from '@/lib/validation/booking';

dayjs.extend(utc);
dayjs.extend(timezone);

type Params = { params: Promise<{ slug: string }> };

// True if the error is the GiST no-overlap exclusion-constraint violation.
function isOverlapError(e: unknown): boolean {
  const msg = String((e as { message?: unknown })?.message ?? '');
  return msg.includes('no_overlap_per_barber') || msg.includes('23P01');
}

// Create a booking (logged-in customer or guest). Public.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const body = createBookingSchema.parse(await req.json());

    const barber = await prisma.barber.findUnique({
      where: { slug },
      select: {
        id: true,
        shopId: true,
        userId: true,
        timezone: true,
        slotGranularityMin: true,
        defaultBufferMin: true,
        deletedAt: true,
        shop: { select: { ownerUserId: true } },
      },
    });
    if (!barber || barber.deletedAt) throw new HttpError(404, 'BARBER_NOT_FOUND', 'Barber not found.');

    // Validate + snapshot the chosen services (must belong to this barber's catalog).
    const services = await prisma.service.findMany({
      where: {
        id: { in: body.serviceIds },
        isActive: true,
        OR: [{ ownerBarberId: barber.id }, ...(barber.shopId ? [{ shopId: barber.shopId }] : [])],
      },
      select: { id: true, type: true, name: true, durationMin: true, priceAmd: true },
    });
    if (services.length !== body.serviceIds.length) {
      throw new HttpError(400, 'INVALID_SERVICES', 'Some services are not available for this barber.');
    }
    const durationMin = services.reduce((s, x) => s + x.durationMin, 0);
    const priceAmd = services.reduce((s, x) => s + x.priceAmd, 0);

    // The chosen start must be a real, currently-available slot.
    const date = dayjs(body.startsAt).tz(barber.timezone).format('YYYY-MM-DD');
    const slots = await getAvailableSlots({
      barberId: barber.id,
      timezone: barber.timezone,
      slotGranularityMin: barber.slotGranularityMin,
      defaultBufferMin: barber.defaultBufferMin,
      date,
      durationMin,
    });
    if (!slots.includes(body.startsAt.toISOString())) {
      throw new HttpError(409, 'SLOT_UNAVAILABLE', 'That time is not available.');
    }

    const user = await getCurrentUser();
    if (!user && !body.guest) {
      throw new HttpError(400, 'GUEST_REQUIRED', 'Provide guest name and phone, or log in.');
    }
    if (user && barber.userId === user.userId) {
      throw new HttpError(403, 'OWN_PROFILE', 'You cannot book yourself.');
    }
    const manageToken = user ? null : crypto.randomBytes(18).toString('base64url');
    const endsAt = new Date(body.startsAt.getTime() + durationMin * 60_000);

    try {
      const booking = await prisma.booking.create({
        data: {
          barberId: barber.id,
          shopId: barber.shopId,
          customerUserId: user?.userId ?? null,
          guestName: user ? null : body.guest!.name,
          guestPhone: user ? null : body.guest!.phone,
          guestEmail: user ? null : body.guest!.email ?? null,
          manageToken,
          startsAt: body.startsAt,
          endsAt,
          status: 'confirmed',
          totalPriceAmd: priceAmd,
          totalDurationMin: durationMin,
          customerNote: body.note ?? null,
          services: {
            create: services.map((s) => ({
              serviceId: s.id,
              typeSnapshot: s.type,
              nameSnapshot: s.name,
              priceAmdSnapshot: s.priceAmd,
              durationMinSnapshot: s.durationMin,
            })),
          },
        },
        select: { id: true, startsAt: true, endsAt: true, status: true, totalPriceAmd: true, totalDurationMin: true },
      });
      // Notify the provider (barber's own account, else the shop owner). Best-effort.
      try {
        const recipientUserId = barber.userId ?? barber.shop?.ownerUserId ?? null;
        if (recipientUserId) {
          const customerName = user
            ? ((
                await prisma.user.findUnique({
                  where: { id: user.userId },
                  select: { fullName: true },
                })
              )?.fullName ?? 'Customer')
            : body.guest!.name;
          await prisma.notification.create({
            data: {
              userId: recipientUserId,
              type: 'booking_created',
              channel: 'inapp',
              payload: {
                bookingId: booking.id,
                customerName,
                startsAt: booking.startsAt.toISOString(),
              },
            },
          });
        }
      } catch (notifyErr) {
        console.error('Failed to write booking notification:', notifyErr);
      }

      return ok({ booking, manageToken }, { status: 201 });
    } catch (e) {
      if (isOverlapError(e)) throw new HttpError(409, 'SLOT_TAKEN', 'That time was just booked.');
      throw e;
    }
  } catch (err) {
    return errorResponse(err);
  }
}
