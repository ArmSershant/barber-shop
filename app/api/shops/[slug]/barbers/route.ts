import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireRole } from '@/lib/auth/rbac';
import { assertOwnsShopBySlug } from '@/lib/auth/ownership';
import { createBarberSchema } from '@/lib/validation/provider';
import { generateUniqueSlug } from '@/lib/slug';

type Params = { params: Promise<{ slug: string }> };

// Public: list a shop's barbers.
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
    const barbers = shop
      ? await prisma.barber.findMany({
          where: { shopId: shop.id, deletedAt: null },
          select: { id: true, slug: true, displayName: true, photoUrl: true, ratingAvg: true },
        })
      : [];
    return ok({ barbers });
  } catch (err) {
    return errorResponse(err);
  }
}

// Owner: add a (shop-managed) barber to the shop.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireRole('shop_owner', 'admin');
    const { slug } = await params;
    const shop = await assertOwnsShopBySlug(slug, userId);

    const data = createBarberSchema.parse(await req.json());
    const barberSlug = await generateUniqueSlug(
      data.displayName,
      'barber',
      async (s) => Boolean(await prisma.barber.findUnique({ where: { slug: s }, select: { id: true } })),
    );

    const barber = await prisma.barber.create({
      data: {
        ...data,
        slug: barberSlug,
        shopId: shop.id,
        districtId: data.districtId ?? shop.districtId,
        status: 'active',
      },
    });

    // Seed the new barber with the shop's default hours + breaks (copy-on-apply).
    const wh = (shop.defaultWorkingHours as unknown as {
      weekday: number;
      startMinute: number;
      endMinute: number;
    }[]) ?? [];
    const br = (shop.defaultBreaks as unknown as {
      weekday: number | null;
      startMinute: number;
      endMinute: number;
    }[]) ?? [];
    if (wh.length) {
      await prisma.workingHours.createMany({
        data: wh.map((i) => ({
          barberId: barber.id,
          weekday: i.weekday,
          startMinute: i.startMinute,
          endMinute: i.endMinute,
        })),
      });
    }
    if (br.length) {
      await prisma.break.createMany({
        data: br.map((i) => ({
          barberId: barber.id,
          weekday: i.weekday ?? null,
          startMinute: i.startMinute,
          endMinute: i.endMinute,
          status: 'approved' as const,
          requestedBy: 'owner' as const,
        })),
      });
    }

    return ok({ barber }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
