import { NextRequest } from 'next/server';
import { errorResponse, ok } from '@/lib/http';
import { REFRESH_COOKIE, revokeRefreshToken, clearAuthCookies } from '@/lib/auth/tokens';

export async function POST(req: NextRequest) {
  try {
    const rawToken = req.cookies.get(REFRESH_COOKIE)?.value;
    if (rawToken) await revokeRefreshToken(rawToken);

    const res = ok({ ok: true });
    clearAuthCookies(res);
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}
