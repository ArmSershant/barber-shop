import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireRole } from '@/lib/auth/rbac';
import { assertOwnsShopBySlug } from '@/lib/auth/ownership';
import { shopDefaultsSchema } from '@/lib/validation/shop-defaults';

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireRole('shop_owner', 'admin');
    const { slug } = await params;
    const shop = await assertOwnsShopBySlug(slug, userId);
    return ok({ workingHours: shop.defaultWorkingHours ?? [], breaks: shop.defaultBreaks ?? [] });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireRole('shop_owner', 'admin');
    const { slug } = await params;
    await assertOwnsShopBySlug(slug, userId);

    const data = shopDefaultsSchema.parse(await req.json());
    await prisma.shop.update({
      where: { slug },
      data: {
        defaultWorkingHours: data.workingHours as unknown as Prisma.InputJsonValue,
        defaultBreaks: data.breaks as unknown as Prisma.InputJsonValue,
      },
    });
    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
