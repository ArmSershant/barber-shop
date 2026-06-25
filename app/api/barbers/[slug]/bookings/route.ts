import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { getCurrentUser } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import { getAvailableSlots } from '@/lib/queries/availability';
import { createBookingSchema } from '@/lib/validation/booking';
import { sendEmail } from '@/lib/email';
import { bookingConfirmationEmail, bookingRequestedEmail } from '@/lib/email-templates';
import { sendSms } from '@/lib/sms';
import { bookingConfirmationSms } from '@/lib/sms-templates';
import { buildIcs } from '@/lib/ics';

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
        displayName: true,
        timezone: true,
        slotGranularityMin: true,
        defaultBufferMin: true,
        deletedAt: true,
        requiresApproval: true,
        shop: { select: { ownerUserId: true, requiresApproval: true } },
      },
    });
    if (!barber || barber.deletedAt) throw new HttpError(404, 'BARBER_NOT_FOUND', 'Barber not found.');

    // Validate + snapshot the chosen services (must belong to this barber's catalog).
    const services = await prisma.service.findMany({
      where: {
        id: { in: body.serviceIds },
        isActive: true,
        OR: [
          { ownerBarberId: barber.id },
          ...(barber.shopId
            ? [{ shopId: barber.shopId, barberServices: { some: { barberId: barber.id } } }]
            : []),
        ],
      },
      select: {
        id: true,
        type: true,
        name: true,
        durationMin: true,
        priceAmd: true,
        barberServices: {
          where: { barberId: barber.id },
          select: { priceAmdOverride: true, durationMinOverride: true },
        },
      },
    });
    if (services.length !== body.serviceIds.length) {
      throw new HttpError(400, 'INVALID_SERVICES', 'Some services are not available for this barber.');
    }

    // Apply per-barber price/duration overrides where present.
    const effectiveServices = services.map((s) => {
      const o = s.barberServices[0];
      return {
        id: s.id,
        type: s.type,
        name: s.name,
        durationMin: o?.durationMinOverride ?? s.durationMin,
        priceAmd: o?.priceAmdOverride ?? s.priceAmd,
      };
    });
    const durationMin = effectiveServices.reduce((s, x) => s + x.durationMin, 0);
    const priceAmd = effectiveServices.reduce((s, x) => s + x.priceAmd, 0);

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
    if (
      user &&
      (barber.userId === user.userId || barber.shop?.ownerUserId === user.userId)
    ) {
      throw new HttpError(403, 'OWN_PROFILE', 'You cannot book yourself.');
    }
    const manageToken = user ? null : crypto.randomBytes(18).toString('base64url');
    const endsAt = new Date(body.startsAt.getTime() + durationMin * 60_000);

    // Shop setting governs shop barbers; otherwise the barber's own setting.
    const requiresApproval = barber.shop
      ? barber.shop.requiresApproval
      : barber.requiresApproval;
    const status = requiresApproval ? 'requested' : 'confirmed';

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
          status,
          totalPriceAmd: priceAmd,
          totalDurationMin: durationMin,
          customerNote: body.note ?? null,
          services: {
            create: effectiveServices.map((s) => ({
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
      // Resolve customer name + email (registered user or guest).
      const customerRecord = user
        ? await prisma.user.findUnique({
            where: { id: user.userId },
            select: { fullName: true, email: true, phone: true },
          })
        : null;
      const customerName = user ? (customerRecord?.fullName ?? 'Customer') : body.guest!.name;
      const customerEmail = user ? (customerRecord?.email ?? null) : (body.guest!.email ?? null);
      const customerPhone = user ? (customerRecord?.phone ?? null) : body.guest!.phone;

      // Notify the provider in-app (barber's own account, else the shop owner).
      try {
        const recipientUserId = barber.userId ?? barber.shop?.ownerUserId ?? null;
        if (recipientUserId) {
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

      // Email the customer a confirmation (best-effort, locale-aware).
      if (customerEmail) {
        const locale = (await cookies()).get('NEXT_LOCALE')?.value;
        const when = new Intl.DateTimeFormat(locale ?? 'hy', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: barber.timezone,
        }).format(booking.startsAt);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barber-shop-alpha-two.vercel.app';
        const manageUrl = manageToken
          ? `${appUrl}/manage?token=${encodeURIComponent(manageToken)}`
          : undefined;
        const emailData = { customerName, barberName: barber.displayName, when, appUrl, manageUrl };

        if (status === 'requested') {
          // Pending approval — no calendar invite until the provider accepts.
          const { subject, html } = bookingRequestedEmail(locale, emailData);
          void sendEmail({ to: customerEmail, subject, html });
        } else {
          const { subject, html } = bookingConfirmationEmail(locale, emailData);
          const ics = buildIcs({
            uid: `${booking.id}@barber-shop.am`,
            start: booking.startsAt,
            end: booking.endsAt,
            summary: `${barber.displayName} — Barber-Shop`,
            url: `${appUrl}/barbers/${slug}`,
          });
          void sendEmail({
            to: customerEmail,
            subject,
            html,
            attachments: [{ filename: 'booking.ics', content: Buffer.from(ics).toString('base64') }],
          });
        }
      }

      // SMS confirmation (best-effort; no-ops until an SMS provider is configured).
      if (customerPhone && status === 'confirmed') {
        const locale = (await cookies()).get('NEXT_LOCALE')?.value;
        const when = new Intl.DateTimeFormat(locale ?? 'hy', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: barber.timezone,
        }).format(booking.startsAt);
        void sendSms({
          to: customerPhone,
          body: bookingConfirmationSms(locale, { barberName: barber.displayName, when }),
        });
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
