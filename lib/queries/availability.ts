import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { prisma } from '@/lib/db';
import { computeSlots } from '@/lib/slots';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface SlotParams {
  barberId: string;
  timezone: string;
  slotGranularityMin: number;
  defaultBufferMin: number;
  date: string; // YYYY-MM-DD (barber-local day)
  durationMin: number;
}

/**
 * Available start times (ISO UTC) for a barber on a given local day:
 *   working hours − breaks − time off − existing bookings(+buffer),
 * sliced onto the slot grid where the full duration fits, future-only.
 */
export async function getAvailableSlots(params: SlotParams): Promise<string[]> {
  const { barberId, timezone: tz, slotGranularityMin, defaultBufferMin, date, durationMin } = params;

  const dayStart = dayjs.tz(date, tz).startOf('day');
  const dayStartMs = dayStart.valueOf();
  const dayEndMs = dayStart.add(1, 'day').valueOf();
  const weekday = (dayStart.day() + 6) % 7; // dayjs: 0=Sun → our 0=Mon

  const [wh, breaks, timeOff, bookings] = await Promise.all([
    prisma.workingHours.findMany({ where: { barberId, weekday }, select: { startMinute: true, endMinute: true } }),
    prisma.break.findMany({
      where: { barberId, status: 'approved', OR: [{ weekday: null }, { weekday }] },
      select: { startMinute: true, endMinute: true },
    }),
    prisma.timeOff.findMany({
      where: {
        barberId,
        status: 'approved',
        startsAt: { lt: new Date(dayEndMs) },
        endsAt: { gt: new Date(dayStartMs) },
      },
      select: { startsAt: true, endsAt: true },
    }),
    prisma.booking.findMany({
      where: {
        barberId,
        status: { in: ['requested', 'confirmed'] },
        startsAt: { lt: new Date(dayEndMs) },
        endsAt: { gt: new Date(dayStartMs) },
      },
      select: { startsAt: true, endsAt: true },
    }),
  ]);

  const atMin = (m: number) => dayStartMs + m * 60_000;

  return computeSlots({
    dayStartMs,
    workingHours: wh.map((w) => ({ start: atMin(w.startMinute), end: atMin(w.endMinute) })),
    breaks: breaks.map((b) => ({ start: atMin(b.startMinute), end: atMin(b.endMinute) })),
    timeOff: timeOff.map((o) => ({ start: o.startsAt.getTime(), end: o.endsAt.getTime() })),
    bookings: bookings.map((bk) => ({
      start: bk.startsAt.getTime(),
      end: bk.endsAt.getTime() + defaultBufferMin * 60_000,
    })),
    slotGranularityMin,
    durationMin,
    nowMs: Date.now(),
  });
}

/** Sum duration + price for the chosen services, scoped to the barber's catalog. */
export async function getServiceTotals(
  barber: { id: string; shopId: string | null },
  serviceIds: string[],
): Promise<{ durationMin: number; priceAmd: number; count: number }> {
  if (serviceIds.length === 0) return { durationMin: 0, priceAmd: 0, count: 0 };

  const services = await prisma.service.findMany({
    where: {
      id: { in: serviceIds },
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
      durationMin: true,
      priceAmd: true,
      barberServices: {
        where: { barberId: barber.id },
        select: { priceAmdOverride: true, durationMinOverride: true },
      },
    },
  });

  // Apply per-barber overrides where present.
  const effective = services.map((s) => {
    const o = s.barberServices[0];
    return {
      durationMin: o?.durationMinOverride ?? s.durationMin,
      priceAmd: o?.priceAmdOverride ?? s.priceAmd,
    };
  });

  return {
    durationMin: effective.reduce((sum, x) => sum + x.durationMin, 0),
    priceAmd: effective.reduce((sum, x) => sum + x.priceAmd, 0),
    count: services.length,
  };
}
