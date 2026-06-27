import { prisma } from '@/lib/db';
import { HttpError } from '@/lib/http';

/** Load a shop by slug and assert the user owns it (admins bypass). Throws 404 / 403. */
export async function assertOwnsShopBySlug(slug: string, userId: string, roles: string[] = []) {
  const shop = await prisma.shop.findUnique({ where: { slug } });
  if (!shop || shop.deletedAt) throw new HttpError(404, 'SHOP_NOT_FOUND', 'Shop not found.');

  const isAdmin = roles.includes('admin');
  if (!isAdmin && shop.ownerUserId !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'You do not own this shop.');
  }
  return shop;
}

/**
 * Load a barber by slug and assert the user may edit it: the barber's own user,
 * the owner of the barber's shop, or an admin.
 */
export async function assertCanEditBarberBySlug(slug: string, userId: string, roles: string[] = []) {
  const barber = await prisma.barber.findUnique({
    where: { slug },
    include: { shop: { select: { ownerUserId: true } } },
  });
  if (!barber || barber.deletedAt) throw new HttpError(404, 'BARBER_NOT_FOUND', 'Barber not found.');

  const isAdmin = roles.includes('admin');
  const isOwnProfile = barber.userId === userId;
  const ownsShop = barber.shop?.ownerUserId === userId;
  if (!isAdmin && !isOwnProfile && !ownsShop) {
    throw new HttpError(403, 'FORBIDDEN', 'You cannot edit this barber.');
  }
  return barber;
}

/**
 * Resolve which catalog the current user owns: their shop's, or (for an
 * independent barber) their own. Exactly one id is non-null. Throws 403 if the
 * user has no provider profile yet.
 */
export async function getProviderCatalogOwner(
  userId: string,
): Promise<{ shopId: string | null; ownerBarberId: string | null }> {
  const shop = await prisma.shop.findFirst({
    where: { ownerUserId: userId, deletedAt: null },
    select: { id: true },
  });
  if (shop) return { shopId: shop.id, ownerBarberId: null };

  const barber = await prisma.barber.findUnique({ where: { userId }, select: { id: true } });
  if (barber) return { shopId: null, ownerBarberId: barber.id };

  throw new HttpError(403, 'NO_PROVIDER_PROFILE', 'Create a shop or barber profile first.');
}

/**
 * Decide the status of a time-off/break record based on who is acting:
 * - shop owner editing one of their barbers → approved
 * - independent barber editing their own profile → approved
 * - shop-employed barber editing their own → pending (needs owner approval)
 */
export function requestStatusFor(
  barber: { userId: string | null; shopId: string | null; shop?: { ownerUserId: string } | null },
  userId: string,
): { status: 'approved' | 'pending'; requestedBy: 'owner' | 'barber' } {
  const isShopEmployee = barber.userId === userId && Boolean(barber.shopId);
  const isOwner = barber.shop?.ownerUserId === userId;
  return {
    status: isShopEmployee ? 'pending' : 'approved',
    requestedBy: isOwner ? 'owner' : 'barber',
  };
}
