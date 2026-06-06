import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { updateMeSchema } from '@/lib/validation/me';

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        emailVerified: true,
        preferredDistrictId: true,
        roles: { select: { role: true } },
      },
    });

    if (!user) {
      // Token valid but the user no longer exists.
      return ok({ user: null }, { status: 404 });
    }

    return ok({
      user: { ...user, roles: user.roles.map((r) => r.role) },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

// Update the current user's own settings (currently: home district).
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const data = updateMeSchema.parse(await req.json());

    if (typeof data.preferredDistrictId === 'number') {
      const exists = await prisma.district.findUnique({
        where: { id: data.preferredDistrictId },
        select: { id: true },
      });
      if (!exists) throw new HttpError(400, 'VALIDATION_ERROR', 'Unknown district.');
    }

    await prisma.user.update({ where: { id: userId }, data });
    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
