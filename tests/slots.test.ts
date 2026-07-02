import { describe, it, expect } from 'vitest';
import { computeSlots, mergeIntervals, subtract } from '@/lib/slots';

const H = (h: number) => h * 3_600_000; // hours → ms from an arbitrary midnight

const base = {
  dayStartMs: 0,
  workingHours: [{ start: H(10), end: H(19) }],
  breaks: [],
  timeOff: [],
  bookings: [],
  slotGranularityMin: 30,
  durationMin: 30,
  nowMs: 0,
};

describe('mergeIntervals', () => {
  it('merges overlapping/adjacent intervals', () => {
    expect(mergeIntervals([{ start: 0, end: 10 }, { start: 10, end: 20 }])).toEqual([{ start: 0, end: 20 }]);
    expect(mergeIntervals([{ start: 0, end: 5 }, { start: 8, end: 12 }])).toEqual([
      { start: 0, end: 5 },
      { start: 8, end: 12 },
    ]);
  });
});

describe('subtract', () => {
  it('splits an interval around a block in the middle', () => {
    expect(subtract([{ start: 0, end: 100 }], [{ start: 40, end: 60 }])).toEqual([
      { start: 0, end: 40 },
      { start: 60, end: 100 },
    ]);
  });
  it('leaves non-overlapping intervals untouched', () => {
    expect(subtract([{ start: 0, end: 10 }], [{ start: 20, end: 30 }])).toEqual([{ start: 0, end: 10 }]);
  });
});

describe('computeSlots', () => {
  it('slices working hours onto the grid where the duration fits', () => {
    const slots = computeSlots(base);
    expect(slots).toHaveLength(18); // 10:00 → 18:30 every 30m
    expect(slots[0]).toBe(new Date(H(10)).toISOString());
    expect(slots.at(-1)).toBe(new Date(H(18.5)).toISOString());
  });

  it('removes slots overlapping an existing booking', () => {
    const slots = computeSlots({ ...base, bookings: [{ start: H(12), end: H(12.5) }] });
    expect(slots).not.toContain(new Date(H(12)).toISOString());
    expect(slots).toHaveLength(17);
  });

  it('drops past slots (future-only)', () => {
    const slots = computeSlots({ ...base, nowMs: H(15) });
    expect(slots[0]).toBe(new Date(H(15)).toISOString());
  });

  it('excludes breaks and time off', () => {
    const slots = computeSlots({
      ...base,
      breaks: [{ start: H(13), end: H(14) }],
      timeOff: [{ start: H(17), end: H(19) }],
    });
    expect(slots).not.toContain(new Date(H(13)).toISOString());
    expect(slots).not.toContain(new Date(H(13.5)).toISOString());
    expect(slots).not.toContain(new Date(H(17)).toISOString());
  });

  it('returns nothing when the service is longer than any free block', () => {
    expect(computeSlots({ ...base, durationMin: 600 })).toEqual([]);
  });
});
