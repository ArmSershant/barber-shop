import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireRole } from '@/lib/auth/rbac';
import { createShopSchema } from '@/lib/validation/provider';
import { generateUniqueSlug } from '@/lib/slug';
import { listShops } from '@/lib/queries/shops';

// Public: list shops for discovery (optional ?q= name search).
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q') ?? undefined;
    const shops = await listShops({ q });
    return ok({ shops });
  } catch (err) {
    return errorResponse(err);
  }
}

// Create a shop owned by the current shop_owner. One shop per owner for MVP.
export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireRole('shop_owner', 'admin');
    const data = createShopSchema.parse(await req.json());

    const existing = await prisma.shop.findFirst({ where: { ownerUserId: userId, deletedAt: null } });
    if (existing) throw new HttpError(409, 'SHOP_EXISTS', 'You already have a shop.');

    const slug = await generateUniqueSlug(
      data.name,
      'shop',
      async (s) => Boolean(await prisma.shop.findUnique({ where: { slug: s }, select: { id: true } })),
    );

    const shop = await prisma.shop.create({
      data: { ...data, slug, ownerUserId: userId },
    });

    return ok({ shop }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
