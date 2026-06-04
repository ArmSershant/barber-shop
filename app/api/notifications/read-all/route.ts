import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';

export async function POST() {
  try {
    const { userId } = await requireAuth();
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
