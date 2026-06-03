import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireRole } from '@/lib/auth/rbac';
import { assertOwnsShopBySlug } from '@/lib/auth/ownership';

type Params = { params: Promise<{ slug: string }> };
type WInterval = { weekday: number; startMinute: number; endMinute: number };
type BInterval = { weekday: number | null; startMinute: number; endMinute: number };

// Copy the shop's default hours + breaks onto every barber (replaces theirs).
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireRole('shop_owner', 'admin');
    const { slug } = await params;
    const shop = await assertOwnsShopBySlug(slug, userId);

    const barbers = await prisma.barber.findMany({
      where: { shopId: shop.id, deletedAt: null },
      select: { id: true },
    });
    const barberIds = barbers.map((b) => b.id);

    const wh = (shop.defaultWorkingHours as unknown as WInterval[]) ?? [];
    const br = (shop.defaultBreaks as unknown as BInterval[]) ?? [];

    await prisma.$transaction([
      prisma.workingHours.deleteMany({ where: { barberId: { in: barberIds } } }),
      prisma.break.deleteMany({ where: { barberId: { in: barberIds } } }),
      prisma.workingHours.createMany({
        data: barberIds.flatMap((barberId) =>
          wh.map((i) => ({
            barberId,
            weekday: i.weekday,
            startMinute: i.startMinute,
            endMinute: i.endMinute,
          })),
        ),
      }),
      prisma.break.createMany({
        data: barberIds.flatMap((barberId) =>
          br.map((i) => ({
            barberId,
            weekday: i.weekday ?? null,
            startMinute: i.startMinute,
            endMinute: i.endMinute,
            status: 'approved' as const,
            requestedBy: 'owner' as const,
          })),
        ),
      }),
    ]);

    return ok({ ok: true, barbers: barberIds.length });
  } catch (err) {
    return errorResponse(err);
  }
}
