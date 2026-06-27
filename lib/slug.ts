/**
 * Turn a name into a URL-safe slug. Latin text becomes a readable slug;
 * non-Latin (e.g. Armenian) names don't transliterate here and fall back to
 * the caller-provided base (e.g. "shop"/"barber"). Transliteration is a
 * future improvement.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Slugs that would clash with app routes or look like system pages.
export const RESERVED_SLUGS = new Set([
  'new',
  'edit',
  'me',
  'admin',
  'api',
  'dashboard',
  'login',
  'register',
  'account',
  'settings',
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

/**
 * Build a unique slug from `name`, using `fallback` when the name produces an
 * empty slug, and `isTaken` to probe the database for collisions.
 */
export async function generateUniqueSlug(
  name: string,
  fallback: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(name) || fallback;
  let candidate = base;
  let n = 2;
  while (await isTaken(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}
