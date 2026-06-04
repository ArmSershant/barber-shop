import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { assertCanEditBarberBySlug } from '@/lib/auth/ownership';
import { updateBarberSchema } from '@/lib/validation/provider';
import { getBarberProfile } from '@/lib/queries/barbers';

type Params = { params: Promise<{ slug: string }> };

// Public: view a barber profile (incl. services + working hours).
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const barber = await getBarberProfile(slug);
    if (!barber) throw new HttpError(404, 'BARBER_NOT_FOUND', 'Barber not found.');
    // Don't expose the owner's user id publicly.
    const { userId: _ownerUserId, ...publicBarber } = barber;
    return ok({ barber: publicBarber });
  } catch (err) {
    return errorResponse(err);
  }
}

// Owner (the barber's user, or the shop owner): update profile.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { slug } = await params;
    await assertCanEditBarberBySlug(slug, userId);

    const data = updateBarberSchema.parse(await req.json());
    const barber = await prisma.barber.update({ where: { slug }, data });
    return ok({ barber });
  } catch (err) {
    return errorResponse(err);
  }
}
