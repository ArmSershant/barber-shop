import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { assertOwnsShopBySlug } from '@/lib/auth/ownership';

type Params = { params: Promise<{ slug: string; id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { slug, id } = await params;
    const shop = await assertOwnsShopBySlug(slug, userId);

    const photo = await prisma.shopPhoto.findUnique({ where: { id }, select: { shopId: true } });
    if (!photo || photo.shopId !== shop.id) {
      throw new HttpError(404, 'NOT_FOUND', 'Photo not found.');
    }
    await prisma.shopPhoto.delete({ where: { id } });
    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
