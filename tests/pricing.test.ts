import { describe, it, expect } from 'vitest';
import { activePromoPercent, autoDiscountPercent, applyPercentDiscount } from '@/lib/pricing';

const now = Date.UTC(2026, 5, 1);
const day = 86_400_000;

describe('activePromoPercent', () => {
  it('returns the percent inside the window', () => {
    expect(activePromoPercent(20, new Date(now - day), new Date(now + day), now)).toBe(20);
  });
  it('is 0 before the start or after the end', () => {
    expect(activePromoPercent(20, new Date(now + day), null, now)).toBe(0);
    expect(activePromoPercent(20, null, new Date(now - day), now)).toBe(0);
  });
  it('is 0 when percent is 0, and clamps/open-ended windows work', () => {
    expect(activePromoPercent(0, null, null, now)).toBe(0);
    expect(activePromoPercent(30, null, null, now)).toBe(30);
  });
});

describe('autoDiscountPercent', () => {
  it('takes the best of promo vs first-visit (no stacking)', () => {
    expect(
      autoDiscountPercent({ promoPercent: 10, firstVisitPercent: 25, isFirstVisit: true, nowMs: now }),
    ).toBe(25);
    expect(
      autoDiscountPercent({ promoPercent: 30, firstVisitPercent: 25, isFirstVisit: true, nowMs: now }),
    ).toBe(30);
  });
  it('ignores first-visit for returning customers', () => {
    expect(
      autoDiscountPercent({ promoPercent: 10, firstVisitPercent: 25, isFirstVisit: false, nowMs: now }),
    ).toBe(10);
  });
  it('respects the promo window', () => {
    expect(
      autoDiscountPercent({
        promoPercent: 30,
        promoStartsAt: new Date(now + day),
        firstVisitPercent: 0,
        isFirstVisit: false,
        nowMs: now,
      }),
    ).toBe(0);
  });
});

describe('applyPercentDiscount', () => {
  it('floors the discount and never goes below 0', () => {
    expect(applyPercentDiscount(2000, 25)).toBe(1500);
    expect(applyPercentDiscount(2001, 25)).toBe(1501); // floor(500.25)=500
    expect(applyPercentDiscount(1000, 0)).toBe(1000);
    expect(applyPercentDiscount(1000, 100)).toBe(0);
  });
});
