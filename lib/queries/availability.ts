import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { prisma } from '@/lib/db';

dayjs.extend(utc);
dayjs.extend(timezone);

interface Interval {
  start: number; // epoch ms
  end: number;
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const out: Interval[] = [];
  for (const iv of sorted) {
    const last = out[out.length - 1];
    if (last && iv.start <= last.end) {
      last.end = Math.max(last.end, iv.end);
    } else {
      out.push({ ...iv });
    }
  }
  return out;
}

/** Remove `blocks` from `intervals` (interval difference). */
function subtract(intervals: Interval[], blocks: Interval[]): Interval[] {
  let result = intervals;
  for (const b of blocks) {
    const next: Interval[] = [];
    for (const iv of result) {
      if (b.end <= iv.start || b.start >= iv.end) {
        next.push(iv); // no overlap
        continue;
      }
      if (b.start > iv.start) next.push({ start: iv.start, end: b.start });
      if (b.end < iv.end) next.push({ start: b.end, end: iv.end });
    }
    result = next;
  }
  return result;
}

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

  let free = mergeIntervals(wh.map((w) => ({ start: atMin(w.startMinute), end: atMin(w.endMinute) })));
  free = subtract(free, breaks.map((b) => ({ start: atMin(b.startMinute), end: atMin(b.endMinute) })));
  free = subtract(free, timeOff.map((o) => ({ start: o.startsAt.getTime(), end: o.endsAt.getTime() })));
  free = subtract(
    free,
    bookings.map((bk) => ({ start: bk.startsAt.getTime(), end: bk.endsAt.getTime() + defaultBufferMin * 60_000 })),
  );

  const slotMs = slotGranularityMin * 60_000;
  const durMs = durationMin * 60_000;
  const nowMs = Date.now();
  const slots: string[] = [];

  for (const iv of free) {
    // Align candidate starts to the slot grid measured from local midnight.
    let t = Math.ceil((iv.start - dayStartMs) / slotMs) * slotMs + dayStartMs;
    for (; t + durMs <= iv.end; t += slotMs) {
      if (t >= nowMs) slots.push(new Date(t).toISOString());
    }
  }
  return slots;
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
