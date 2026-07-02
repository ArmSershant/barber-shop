// Armenian (lowercase) \u2192 Latin. Applied so Armenian names produce readable
// slugs (\u054e\u0561\u0580\u0564\u0563\u0565\u057d \u2192 "vardges") instead of falling back to a generic base.
const ARMENIAN_TO_LATIN: Record<string, string> = {
  \u0561: 'a', \u0562: 'b', \u0563: 'g', \u0564: 'd', \u0565: 'e', \u0566: 'z', \u0567: 'e', \u0568: 'e', \u0569: 't',
  \u056a: 'zh', \u056b: 'i', \u056c: 'l', \u056d: 'kh', \u056e: 'ts', \u056f: 'k', \u0570: 'h', \u0571: 'dz', \u0572: 'gh',
  \u0573: 'ch', \u0574: 'm', \u0575: 'y', \u0576: 'n', \u0577: 'sh', \u0578: 'o', \u0579: 'ch', \u057a: 'p', \u057b: 'j',
  \u057c: 'r', \u057d: 's', \u057e: 'v', \u057f: 't', \u0580: 'r', \u0581: 'ts', \u0582: 'u', \u0583: 'p', \u0584: 'q',
  \u0585: 'o', \u0586: 'f',
};

function transliterateArmenian(input: string): string {
  return input
    .replace(/\u0578\u0582/g, 'u') // digraph
    .replace(/\u0587/g, 'ev') // ech-yiwn ligature
    .replace(/[\u0561-\u0586]/g, (ch) => ARMENIAN_TO_LATIN[ch] ?? '');
}

/**
 * Turn a name into a URL-safe slug. Armenian text is transliterated to Latin;
 * other non-Latin scripts still fall back to the caller-provided base
 * (e.g. "shop"/"barber") when nothing usable remains.
 */
export function slugify(input: string): string {
  return transliterateArmenian(input.toLowerCase())
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
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
