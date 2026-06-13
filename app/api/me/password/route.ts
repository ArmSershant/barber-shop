import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { changePasswordSchema } from '@/lib/validation/me';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { currentPassword, newPassword } = changePasswordSchema.parse(await req.json());

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash || !(await verifyPassword(user.passwordHash, currentPassword))) {
      throw new HttpError(400, 'INVALID_CREDENTIALS', 'Current password is incorrect.');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
