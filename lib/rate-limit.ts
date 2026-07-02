import { prisma } from '@/lib/db';
import { HttpError } from '@/lib/http';

// Fixed-window rate limiting backed by the existing Neon DB (no extra service).
// One atomic upsert per check: increment within the current window, or reset
// when it has elapsed. Fails OPEN — a limiter error never blocks a real request.
//
// Turn off entirely with RATE_LIMIT_DISABLED=true (e.g. for load tests).

const DISABLED = process.env.RATE_LIMIT_DISABLED === 'true';

/** Returns true if the request is allowed, false if the limit is exceeded. */
export async function checkRateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  if (DISABLED) return true;
  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO rate_limits ("key", "count", "window_start")
      VALUES (${key}, 1, now())
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN rate_limits."window_start" < now() - (${windowSec} * interval '1 second') THEN 1
          ELSE rate_limits."count" + 1 END,
        "window_start" = CASE
          WHEN rate_limits."window_start" < now() - (${windowSec} * interval '1 second') THEN now()
          ELSE rate_limits."window_start" END
      RETURNING "count";
    `;
    return Number(rows[0]?.count ?? 1) <= limit;
  } catch (err) {
    console.error('[rate-limit] check failed, allowing request:', err);
    return true; // fail open
  }
}

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  return xff?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

/**
 * Enforce a per-IP limit for a named bucket; throws 429 when exceeded.
 * @param bucket   logical action, e.g. 'login' (namespaces the counter)
 * @param limit    max requests allowed per window
 * @param windowSec window length in seconds
 */
export async function enforceRateLimit(
  req: Request,
  bucket: string,
  limit: number,
  windowSec: number,
): Promise<void> {
  const ok = await checkRateLimit(`${bucket}:${clientIp(req)}`, limit, windowSec);
  if (!ok) {
    throw new HttpError(429, 'RATE_LIMITED', 'Too many requests. Please wait a moment and try again.');
  }
}
