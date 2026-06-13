import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { assertOwnsShopBySlug } from '@/lib/auth/ownership';

type Params = { params: Promise<{ slug: string }> };
const addSchema = z.object({ url: z.string().url() });
const MAX_PHOTOS = 24;

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { slug } = await params;
    const shop = await assertOwnsShopBySlug(slug, userId);
    const photos = await prisma.shopPhoto.findMany({
      where: { shopId: shop.id },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, url: true },
    });
    return ok({ photos });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { slug } = await params;
    const shop = await assertOwnsShopBySlug(slug, userId);
    const { url } = addSchema.parse(await req.json());

    const count = await prisma.shopPhoto.count({ where: { shopId: shop.id } });
    const photo = await prisma.shopPhoto.create({
      data: { shopId: shop.id, url, sortOrder: Math.min(count, MAX_PHOTOS) },
      select: { id: true, url: true },
    });
    return ok({ photo });
  } catch (err) {
    return errorResponse(err);
  }
}
