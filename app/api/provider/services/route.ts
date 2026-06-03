import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireRole } from '@/lib/auth/rbac';
import { getProviderCatalogOwner } from '@/lib/auth/ownership';
import { createServiceSchema } from '@/lib/validation/service';

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

    const service = await prisma.service.create({
      data: { ...data, shopId: owner.shopId, ownerBarberId: owner.ownerBarberId },
    });
    return ok({ service }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
