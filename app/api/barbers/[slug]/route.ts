import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { assertCanEditBarberBySlug } from '@/lib/auth/ownership';
import { updateBarberSchema } from '@/lib/validation/provider';

type Params = { params: Promise<{ slug: string }> };

// Public: view a barber profile.
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const barber = await prisma.barber.findUnique({
      where: { slug },
      include: {
        shop: { select: { slug: true, name: true } },
        district: { select: { nameEn: true, nameHy: true, slug: true } },
        portfolioImages: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!barber || barber.deletedAt) throw new HttpError(404, 'BARBER_NOT_FOUND', 'Barber not found.');
    return ok({ barber });
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
