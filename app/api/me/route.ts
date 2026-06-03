import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';

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
