import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { assertCanEditBarberBySlug } from '@/lib/auth/ownership';
import { updateBarberSchema } from '@/lib/validation/provider';
import { getBarberProfile } from '@/lib/queries/barbers';
import { deleteReplacedBlob } from '@/lib/blob';
import { isReservedSlug } from '@/lib/slug';

type Params = { params: Promise<{ slug: string }> };

// Public: view a barber profile (incl. services + working hours).
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const barber = await getBarberProfile(slug);
    if (!barber) throw new HttpError(404, 'BARBER_NOT_FOUND', 'Barber not found.');
    // Don't expose internal owner ids publicly.
    const { userId: _ownerUserId, ...rest } = barber;
    const publicBarber = {
      ...rest,
      shop: barber.shop ? { slug: barber.shop.slug, name: barber.shop.name } : null,
    };
    return ok({ barber: publicBarber });
  } catch (err) {
    return errorResponse(err);
  }
}

// Owner (the barber's user, or the shop owner): update profile.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId, roles } = await requireAuth();
    const { slug } = await params;
    const existing = await assertCanEditBarberBySlug(slug, userId, roles);

    const data = updateBarberSchema.parse(await req.json());

    // Renaming the page URL: enforce reserved words + uniqueness.
    if (data.slug && data.slug !== slug) {
      if (isReservedSlug(data.slug)) {
        throw new HttpError(409, 'SLUG_TAKEN', 'That URL is not available.');
      }
      const clash = await prisma.barber.findUnique({
        where: { slug: data.slug },
        select: { id: true },
      });
      if (clash) throw new HttpError(409, 'SLUG_TAKEN', 'That URL is already taken.');
    }

    const barber = await prisma.barber.update({ where: { slug }, data });

    // Clean up replaced images from Blob storage.
    if (data.photoUrl !== undefined) await deleteReplacedBlob(existing.photoUrl, data.photoUrl);
    if (data.coverUrl !== undefined) await deleteReplacedBlob(existing.coverUrl, data.coverUrl);

    return ok({ barber });
  } catch (err) {
    return errorResponse(err);
  }
}
