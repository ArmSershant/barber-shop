import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireRole } from '@/lib/auth/rbac';

type Params = { params: Promise<{ id: string }> };

/**
 * Permanently delete a user account. Removes dependent records in order so the
 * delete doesn't hit FK restrictions (reviews, bookings, their barber profile,
 * and any shops they own). Cascading relations (roles, tokens, notifications,
 * favorites) are handled by the schema. Irreversible.
 */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const admin = await requireRole('admin');
    const { id } = await params;
    if (id === admin.userId) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'You cannot delete your own account.');
    }

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new HttpError(404, 'NOT_FOUND', 'User not found.');

    await prisma.$transaction(async (tx) => {
      const barber = await tx.barber.findUnique({ where: { userId: id }, select: { id: true } });
      const shops = await tx.shop.findMany({ where: { ownerUserId: id }, select: { id: true } });
      const barberIds = barber ? [barber.id] : [];
      const shopIds = shops.map((s) => s.id);

      // Bookings tied to this account (as customer, via their barber profile, or their shops).
      await tx.booking.deleteMany({
        where: {
          OR: [
            { customerUserId: id },
            ...(barberIds.length ? [{ barberId: { in: barberIds } }] : []),
            ...(shopIds.length ? [{ shopId: { in: shopIds } }] : []),
          ],
        },
      });

      // Reviews authored by the user, or left on their barber profile.
      await tx.review.deleteMany({
        where: {
          OR: [{ customerUserId: id }, ...(barberIds.length ? [{ barberId: { in: barberIds } }] : [])],
        },
      });

      if (barberIds.length) await tx.barber.deleteMany({ where: { id: { in: barberIds } } });
      if (shopIds.length) await tx.shop.deleteMany({ where: { id: { in: shopIds } } });

      await tx.user.delete({ where: { id } });
    });

    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
