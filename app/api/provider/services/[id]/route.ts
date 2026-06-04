import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireRole } from '@/lib/auth/rbac';
import { getProviderCatalogOwner } from '@/lib/auth/ownership';
import { updateServiceSchema } from '@/lib/validation/service';
import { SERVICE_TYPE_LABELS_EN } from '@/lib/service-types';

type Params = { params: Promise<{ id: string }> };

async function loadOwnedService(userId: string, id: string) {
  const owner = await getProviderCatalogOwner(userId);
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) throw new HttpError(404, 'SERVICE_NOT_FOUND', 'Service not found.');

  const owns =
    (owner.shopId && service.shopId === owner.shopId) ||
    (owner.ownerBarberId && service.ownerBarberId === owner.ownerBarberId);
  if (!owns) throw new HttpError(403, 'FORBIDDEN', 'This service is not in your catalog.');

  return service;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireRole('shop_owner', 'barber', 'admin');
    const { id } = await params;
    await loadOwnedService(userId, id);

    const input = updateServiceSchema.parse(await req.json());
    const service = await prisma.service.update({
      where: { id },
      data: {
        ...input,
        ...(input.type && input.type !== 'other'
          ? { name: SERVICE_TYPE_LABELS_EN[input.type] }
          : {}),
      },
    });
    return ok({ service });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireRole('shop_owner', 'barber', 'admin');
    const { id } = await params;
    await loadOwnedService(userId, id);

    await prisma.service.delete({ where: { id } });
    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
