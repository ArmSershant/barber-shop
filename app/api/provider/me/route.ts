import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';

// The current user's provider profile(s): the shop they own and/or their own
// barber profile. Drives the provider dashboard.
export async function GET() {
  try {
    const { userId } = await requireAuth();

    const [shop, barber] = await Promise.all([
      prisma.shop.findFirst({ where: { ownerUserId: userId, deletedAt: null } }),
      prisma.barber.findUnique({ where: { userId } }),
    ]);

    return ok({ shop: shop ?? null, barber: barber ?? null });
  } catch (err) {
    return errorResponse(err);
  }
}
