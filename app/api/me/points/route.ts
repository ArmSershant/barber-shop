import { errorResponse, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { prisma } from '@/lib/db';

// A customer's loyalty points, grouped per provider (shop or independent
// barber), plus recent activity. Balances are computed from the ledger.
export async function GET() {
  try {
    const { userId } = await requireAuth();

    const [grouped, entries] = await Promise.all([
      prisma.pointsLedger.groupBy({
        by: ['scopeShopId', 'scopeBarberId'],
        where: { userId },
        _sum: { delta: true },
      }),
      prisma.pointsLedger.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          delta: true,
          reason: true,
          createdAt: true,
          scopeShop: { select: { name: true, slug: true } },
          scopeBarber: { select: { displayName: true, slug: true } },
        },
      }),
    ]);

    const providers = grouped
      .map((g) => ({
        balance: g._sum.delta ?? 0,
        scopeShopId: g.scopeShopId,
        scopeBarberId: g.scopeBarberId,
      }))
      .filter((p) => p.balance !== 0);

    // Resolve provider names for the grouped balances.
    const shopIds = providers.map((p) => p.scopeShopId).filter((x): x is string => !!x);
    const barberIds = providers.map((p) => p.scopeBarberId).filter((x): x is string => !!x);
    const [shops, barbers] = await Promise.all([
      shopIds.length
        ? prisma.shop.findMany({ where: { id: { in: shopIds } }, select: { id: true, name: true, slug: true } })
        : Promise.resolve([]),
      barberIds.length
        ? prisma.barber.findMany({
            where: { id: { in: barberIds } },
            select: { id: true, displayName: true, slug: true },
          })
        : Promise.resolve([]),
    ]);
    const shopById = new Map(shops.map((s) => [s.id, s]));
    const barberById = new Map(barbers.map((b) => [b.id, b]));

    const balances = providers.map((p) => {
      if (p.scopeShopId) {
        const s = shopById.get(p.scopeShopId);
        return { kind: 'shop' as const, name: s?.name ?? '', slug: s?.slug ?? '', balance: p.balance };
      }
      const b = p.scopeBarberId ? barberById.get(p.scopeBarberId) : undefined;
      return { kind: 'barber' as const, name: b?.displayName ?? '', slug: b?.slug ?? '', balance: p.balance };
    });

    const history = entries.map((e) => ({
      id: e.id,
      delta: e.delta,
      reason: e.reason,
      createdAt: e.createdAt,
      providerName: e.scopeShop?.name ?? e.scopeBarber?.displayName ?? null,
    }));

    return ok({ balances, history });
  } catch (err) {
    return errorResponse(err);
  }
}
