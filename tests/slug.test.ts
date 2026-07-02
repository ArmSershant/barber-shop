import { describe, it, expect } from 'vitest';
import { slugify, isReservedSlug, generateUniqueSlug } from '@/lib/slug';

describe('slugify', () => {
  it('slugifies Latin names', () => {
    expect(slugify('Old Town Cuts')).toBe('old-town-cuts');
    expect(slugify('  Hello!! ')).toBe('hello');
    expect(slugify('Café Déjà')).toBe('cafe-deja');
  });
  it('transliterates Armenian', () => {
    expect(slugify('Վարդգես')).toBe('vardges');
    expect(slugify('Հայկ Պետրոսյան')).toBe('hayk-petrosyan');
  });
  it('transliterates Russian', () => {
    expect(slugify('Артём')).toBe('artyom');
    expect(slugify('Салон красоты')).toBe('salon-krasoty');
  });
  it('handles mixed scripts', () => {
    expect(slugify('Հայկ Petrosyan')).toBe('hayk-petrosyan');
  });
  it('yields empty string when nothing is usable', () => {
    expect(slugify('Ω')).toBe(''); // unsupported script → caller uses fallback
  });
});

describe('isReservedSlug', () => {
  it('flags reserved words', () => {
    expect(isReservedSlug('new')).toBe(true);
    expect(isReservedSlug('admin')).toBe(true);
  });
  it('allows normal slugs', () => {
    expect(isReservedSlug('vardges')).toBe(false);
  });
});

describe('generateUniqueSlug', () => {
  it('appends a number on collision', async () => {
    const taken = new Set(['test', 'test-2']);
    const slug = await generateUniqueSlug('Test', 'barber', async (s) => taken.has(s));
    expect(slug).toBe('test-3');
  });
  it('falls back when the name produces no usable slug', async () => {
    const slug = await generateUniqueSlug('Ω', 'barber', async () => false);
    expect(slug).toBe('barber');
  });
});
