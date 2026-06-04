import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';

// Latest in-app notifications for the current user + unread count.
export async function GET() {
  try {
    const { userId } = await requireAuth();

    const [notifications, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, type: true, payload: true, readAt: true, createdAt: true },
      }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return ok({ notifications, unread });
  } catch (err) {
    return errorResponse(err);
  }
}
