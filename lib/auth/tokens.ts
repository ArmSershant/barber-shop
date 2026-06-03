import crypto from 'node:crypto';
import type { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { HttpError } from '@/lib/http';
import { signAccessToken, type Role } from '@/lib/auth/jwt';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

const ACCESS_MAX_AGE = 15 * 60; // seconds (matches the 15m JWT TTL)
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
// Refresh cookie is only sent to the auth endpoints that need it.
const REFRESH_PATH = '/api/auth';

const isProd = process.env.NODE_ENV === 'production';

export interface RequestMeta {
  userAgent?: string | null;
  ip?: string | null;
}

function sha256(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function randomToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function setAuthCookies(res: NextResponse, accessToken: string, refreshToken: string): void {
  res.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_MAX_AGE,
  });
  res.cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: REFRESH_PATH,
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_COOKIE, '', { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: REFRESH_PATH,
    maxAge: 0,
  });
}

/** Sign a fresh access token, mint a refresh token, and set both cookies. */
export async function establishSession(
  res: NextResponse,
  userId: string,
  roles: Role[],
  meta?: RequestMeta,
): Promise<void> {
  const accessToken = await signAccessToken({ sub: userId, roles });
  const refreshToken = await createRefreshToken(userId, meta);
  setAuthCookies(res, accessToken, refreshToken);
}

/** Create and persist a new refresh token; returns the raw (unhashed) value. */
export async function createRefreshToken(userId: string, meta?: RequestMeta): Promise<string> {
  const raw = randomToken();
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: sha256(raw),
      expiresAt: new Date(Date.now() + REFRESH_MAX_AGE * 1000),
      userAgent: meta?.userAgent ?? null,
      ip: meta?.ip ?? null,
    },
  });
  return raw;
}

/**
 * Rotate a refresh token: validate it, revoke it, and issue a replacement.
 * Reuse detection: presenting an already-revoked token revokes every active
 * token for that user (assume the chain is compromised).
 */
export async function rotateRefreshToken(
  rawToken: string,
  meta?: RequestMeta,
): Promise<{ userId: string; refreshRaw: string }> {
  const tokenHash = sha256(rawToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!existing) throw new HttpError(401, 'INVALID_REFRESH', 'Invalid refresh token.');

  if (existing.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: existing.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new HttpError(401, 'REFRESH_REUSE', 'Refresh token reuse detected; all sessions revoked.');
  }

  if (existing.expiresAt.getTime() < Date.now()) {
    throw new HttpError(401, 'EXPIRED_REFRESH', 'Refresh token expired.');
  }

  const refreshRaw = randomToken();
  const created = await prisma.refreshToken.create({
    data: {
      userId: existing.userId,
      tokenHash: sha256(refreshRaw),
      expiresAt: new Date(Date.now() + REFRESH_MAX_AGE * 1000),
      userAgent: meta?.userAgent ?? null,
      ip: meta?.ip ?? null,
    },
  });
  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date(), replacedById: created.id },
  });

  return { userId: existing.userId, refreshRaw };
}

/** Revoke a single refresh token (logout). No-op if unknown/already revoked. */
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: sha256(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
