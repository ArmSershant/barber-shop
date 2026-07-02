// Pure slot-availability math (no DB, no timezone lib) so it's easy to unit
// test. The DB-backed wrapper lives in lib/queries/availability.ts.

export interface Interval {
  start: number; // epoch ms
  end: number;
}

export function mergeIntervals(intervals: Interval[]): Interval[] {
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
export function subtract(intervals: Interval[], blocks: Interval[]): Interval[] {
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

export interface ComputeSlotsArgs {
  dayStartMs: number; // local midnight of the target day, in epoch ms
  workingHours: Interval[];
  breaks: Interval[];
  timeOff: Interval[];
  bookings: Interval[]; // ends already include any buffer
  slotGranularityMin: number;
  durationMin: number;
  nowMs: number; // slots strictly before this are dropped (future-only)
}

/**
 * Bookable start times (ISO UTC) for a day:
 *   working hours − breaks − time off − bookings(+buffer),
 * sliced onto the slot grid (measured from local midnight) where the full
 * service duration fits, future-only.
 */
export function computeSlots(args: ComputeSlotsArgs): string[] {
  const { dayStartMs, workingHours, breaks, timeOff, bookings, slotGranularityMin, durationMin, nowMs } = args;

  let free = mergeIntervals(workingHours);
  free = subtract(free, breaks);
  free = subtract(free, timeOff);
  free = subtract(free, bookings);

  const slotMs = slotGranularityMin * 60_000;
  const durMs = durationMin * 60_000;
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
