import { prisma } from '@/lib/db';
import { HttpError } from '@/lib/http';

/** Load a shop by slug and assert the user owns it. Throws 404 / 403. */
export async function assertOwnsShopBySlug(slug: string, userId: string) {
  const shop = await prisma.shop.findUnique({ where: { slug } });
  if (!shop || shop.deletedAt) throw new HttpError(404, 'SHOP_NOT_FOUND', 'Shop not found.');
  if (shop.ownerUserId !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'You do not own this shop.');
  }
  return shop;
}

/**
 * Load a barber by slug and assert the user may edit it: either the barber's
 * own user, or the owner of the barber's shop.
 */
export async function assertCanEditBarberBySlug(slug: string, userId: string) {
  const barber = await prisma.barber.findUnique({
    where: { slug },
    include: { shop: { select: { ownerUserId: true } } },
  });
  if (!barber || barber.deletedAt) throw new HttpError(404, 'BARBER_NOT_FOUND', 'Barber not found.');

  const isOwnProfile = barber.userId === userId;
  const ownsShop = barber.shop?.ownerUserId === userId;
  if (!isOwnProfile && !ownsShop) {
    throw new HttpError(403, 'FORBIDDEN', 'You cannot edit this barber.');
  }
  return barber;
}
