import { describe, it, expect } from 'vitest';
import { pointsForAmount, cappedRedeemPoints, shouldExpire } from '@/lib/loyalty-math';

describe('pointsForAmount', () => {
  it('floors points at the provider rate', () => {
    expect(pointsForAmount(2000, 1)).toBe(20);
    expect(pointsForAmount(2000, 5)).toBe(100);
    expect(pointsForAmount(150, 1)).toBe(1); // floor(1.5)
  });
  it('returns 0 for non-positive inputs', () => {
    expect(pointsForAmount(0, 1)).toBe(0);
    expect(pointsForAmount(2000, 0)).toBe(0);
    expect(pointsForAmount(-100, 1)).toBe(0);
  });
});

describe('cappedRedeemPoints', () => {
  it('caps by balance', () => {
    expect(cappedRedeemPoints({ requested: 100, balance: 50, priceAmd: 2000, amdPerPoint: 1, maxRedeemPct: 50 })).toBe(50);
  });
  it('caps by the max-% discount and point value', () => {
    // max discount = 25% of 2000 = 500 ֏; at 10 ֏/pt → 50 points max
    expect(cappedRedeemPoints({ requested: 100, balance: 80, priceAmd: 2000, amdPerPoint: 10, maxRedeemPct: 25 })).toBe(50);
  });
  it('caps by the requested amount', () => {
    expect(cappedRedeemPoints({ requested: 10, balance: 500, priceAmd: 5000, amdPerPoint: 1, maxRedeemPct: 100 })).toBe(10);
  });
  it('returns 0 when any input disables redemption', () => {
    expect(cappedRedeemPoints({ requested: 0, balance: 50, priceAmd: 2000, amdPerPoint: 1, maxRedeemPct: 50 })).toBe(0);
    expect(cappedRedeemPoints({ requested: 100, balance: 0, priceAmd: 2000, amdPerPoint: 1, maxRedeemPct: 50 })).toBe(0);
    expect(cappedRedeemPoints({ requested: 100, balance: 50, priceAmd: 2000, amdPerPoint: 0, maxRedeemPct: 50 })).toBe(0);
    expect(cappedRedeemPoints({ requested: 100, balance: 50, priceAmd: 2000, amdPerPoint: 1, maxRedeemPct: 0 })).toBe(0);
  });
});

describe('shouldExpire', () => {
  const now = Date.UTC(2026, 0, 1);
  const monthsAgo = (m: number) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - m);
    return d.getTime();
  };
  it('expires a positive balance inactive past 12 months', () => {
    expect(shouldExpire(30, monthsAgo(13), now)).toBe(true);
  });
  it('keeps a balance with recent activity', () => {
    expect(shouldExpire(30, monthsAgo(3), now)).toBe(false);
  });
  it('never expires a zero/negative balance', () => {
    expect(shouldExpire(0, monthsAgo(24), now)).toBe(false);
  });
});
