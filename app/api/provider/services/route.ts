import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireRole } from '@/lib/auth/rbac';
import { getProviderCatalogOwner } from '@/lib/auth/ownership';
import { createServiceSchema } from '@/lib/validation/service';
import { SERVICE_TYPE_LABELS_EN } from '@/lib/service-types';

// List the current provider's service catalog.
export async function GET() {
  try {
    const { userId } = await requireRole('shop_owner', 'barber', 'admin');
    const owner = await getProviderCatalogOwner(userId);

    const services = await prisma.service.findMany({
      where: owner.shopId ? { shopId: owner.shopId } : { ownerBarberId: owner.ownerBarberId },
      orderBy: { createdAt: 'asc' },
    });
    return ok({ services });
  } catch (err) {
    return errorResponse(err);
  }
}

// Add a service to the current provider's catalog.
export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireRole('shop_owner', 'barber', 'admin');
    const owner = await getProviderCatalogOwner(userId);
    const data = createServiceSchema.parse(await req.json());
    // Canonical types store the English label as the universal fallback name.
    const name = data.type === 'other' ? data.name! : SERVICE_TYPE_LABELS_EN[data.type];

    const service = await prisma.service.create({
      data: {
        type: data.type,
        name,
        description: data.description,
        durationMin: data.durationMin,
        priceAmd: data.priceAmd,
        shopId: owner.shopId,
        ownerBarberId: owner.ownerBarberId,
      },
    });
    return ok({ service }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
