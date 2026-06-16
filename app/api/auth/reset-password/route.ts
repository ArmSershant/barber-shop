import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { resetPasswordSchema } from '@/lib/validation/auth';
import { consumeAuthToken } from '@/lib/auth/verification';
import { hashPassword } from '@/lib/auth/password';

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(await req.json());
    const userId = await consumeAuthToken(token, 'password_reset');

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    // Revoke any active sessions — a reset should log other sessions out.
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
