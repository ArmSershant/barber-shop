// Syncs a user's newsletter opt-in into Resend Segments (static lists).
// Resend segments are membership lists you add/remove contacts to by ID, so we
// map each "{audience}:{lang}" to a Resend Segment ID and move the contact into
// the right one. You then send Broadcasts to each segment from the dashboard.
//
// Two audiences: providers (barbers + shop owners) get feature updates;
// customers get tips/promos. Split by language.
//
// Config: reuses EMAIL_API_KEY (Resend) + NEWSLETTER_SEGMENTS, a JSON map of
// "{audience}:{lang}" → segmentId, e.g.
//   {"provider:hy":"seg_..","customer:hy":"seg_..","customer:en":"seg_.."}
// No-ops when unconfigured, so dev/CI and "not live yet" work untouched.

type Audience = 'provider' | 'customer';
const LANGS = ['hy', 'en', 'ru'] as const;

function audienceFor(roles: string[]): Audience {
  return roles.includes('barber') || roles.includes('shop_owner') ? 'provider' : 'customer';
}

function segmentMap(): Record<string, string> {
  try {
    return JSON.parse(process.env.NEWSLETTER_SEGMENTS || '{}');
  } catch {
    return {};
  }
}

export async function syncNewsletterContact(p: {
  email: string;
  fullName?: string | null;
  optIn: boolean;
  lang: string | null | undefined;
  roles: string[];
}): Promise<void> {
  const apiKey = process.env.EMAIL_API_KEY;
  const map = segmentMap();
  if (!apiKey || Object.keys(map).length === 0) return; // not configured → no-op

  const auth = { Authorization: `Bearer ${apiKey}` };
  const jsonAuth = { ...auth, 'Content-Type': 'application/json' };
  const email = encodeURIComponent(p.email);
  const lang = (LANGS as readonly string[]).includes(p.lang ?? '') ? (p.lang as string) : 'hy';
  const audience = audienceFor(p.roles);
  // Prefer a language-specific segment ("provider:hy"); fall back to an
  // audience-only segment ("provider") when the plan limits segment count.
  const targetId = map[`${audience}:${lang}`] ?? map[audience];
  const allIds = [...new Set(Object.values(map))];

  try {
    // Ensure the contact exists (create; harmless if it already does).
    await fetch('https://api.resend.com/contacts', {
      method: 'POST',
      headers: jsonAuth,
      body: JSON.stringify({ email: p.email, first_name: p.fullName ?? undefined, unsubscribed: !p.optIn }),
    });

    // Remove from every configured segment (handles opt-out + audience/lang change)…
    await Promise.all(
      allIds.map((id) =>
        fetch(`https://api.resend.com/contacts/${email}/segments/${id}`, { method: 'DELETE', headers: auth }),
      ),
    );

    // …then add to the right one if still opted in.
    if (p.optIn && targetId) {
      await fetch(`https://api.resend.com/contacts/${email}/segments/${targetId}`, {
        method: 'POST',
        headers: auth,
      });
    }
  } catch (err) {
    console.error('[newsletter] sync failed', err);
  }
}
