import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireRole } from '@/lib/auth/rbac';
import { assertOwnsShopBySlug } from '@/lib/auth/ownership';
import { updateShopSchema } from '@/lib/validation/provider';

type Params = { params: Promise<{ slug: string }> };

// Public: view a shop and its barbers.
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const shop = await prisma.shop.findUnique({
      where: { slug },
      include: {
        district: { select: { nameEn: true, nameHy: true, slug: true } },
        photos: { orderBy: { sortOrder: 'asc' } },
        barbers: {
          where: { deletedAt: null },
          select: { id: true, slug: true, displayName: true, photoUrl: true, ratingAvg: true },
        },
      },
    });
    if (!shop || shop.deletedAt) throw new HttpError(404, 'SHOP_NOT_FOUND', 'Shop not found.');
    return ok({ shop });
  } catch (err) {
    return errorResponse(err);
  }
}

// Owner: update shop fields.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireRole('shop_owner', 'admin');
    const { slug } = await params;
    await assertOwnsShopBySlug(slug, userId);

    const data = updateShopSchema.parse(await req.json());
    const shop = await prisma.shop.update({ where: { slug }, data });
    return ok({ shop });
  } catch (err) {
    return errorResponse(err);
  }
}
