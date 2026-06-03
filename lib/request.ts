import type { NextRequest } from 'next/server';
import type { RequestMeta } from '@/lib/auth/tokens';

/** Best-effort client metadata for audit trails on refresh tokens. */
export function requestMeta(req: NextRequest): RequestMeta {
  return {
    userAgent: req.headers.get('user-agent'),
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
  };
}
