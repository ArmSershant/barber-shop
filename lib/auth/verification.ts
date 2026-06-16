import crypto from 'node:crypto';
import { prisma } from '@/lib/db';
import { HttpError } from '@/lib/http';
import type { AuthTokenType } from '@prisma/client';

const TTL: Record<AuthTokenType, number> = {
  email_verify: 24 * 60 * 60 * 1000, // 24h
  password_reset: 60 * 60 * 1000, // 1h
};

function sha256(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/** Create a single-use token of the given type; returns the raw value to email. */
export async function createAuthToken(userId: string, type: AuthTokenType): Promise<string> {
  const raw = crypto.randomBytes(32).toString('base64url');
  await prisma.authToken.create({
    data: {
      userId,
      type,
      tokenHash: sha256(raw),
      expiresAt: new Date(Date.now() + TTL[type]),
    },
  });
  return raw;
}

/** Validate + consume a token (marks it used). Returns the owning userId. */
export async function consumeAuthToken(raw: string, type: AuthTokenType): Promise<string> {
  const invalid = new HttpError(400, 'INVALID_TOKEN', 'This link is invalid or has expired.');
  const token = await prisma.authToken.findUnique({ where: { tokenHash: sha256(raw) } });

  if (!token || token.type !== type || token.usedAt || token.expiresAt.getTime() < Date.now()) {
    throw invalid;
  }

  await prisma.authToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });
  return token.userId;
}
