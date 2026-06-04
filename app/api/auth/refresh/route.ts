import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { signAccessToken, type Role } from '@/lib/auth/jwt';
import {
  REFRESH_COOKIE,
  rotateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from '@/lib/auth/tokens';
import { requestMeta } from '@/lib/request';

export async function POST(req: NextRequest) {
  try {
    const rawToken = req.cookies.get(REFRESH_COOKIE)?.value;
    if (!rawToken) throw new HttpError(401, 'NO_REFRESH', 'No refresh token.');

    let userId: string;
    let refreshRaw: string;
    try {
      ({ userId, refreshRaw } = await rotateRefreshToken(rawToken, requestMeta(req)));
    } catch (e) {
      // On any refresh failure, also clear the (now useless) cookies.
      const res = await errorResponse(e);
      clearAuthCookies(res);
      return res;
    }

    const roleRows = await prisma.userRole.findMany({ where: { userId }, select: { role: true } });
    const roles = roleRows.map((r) => r.role) as Role[];

    const accessToken = await signAccessToken({ sub: userId, roles });
    const res = ok({ ok: true });
    setAuthCookies(res, accessToken, refreshRaw);
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}
