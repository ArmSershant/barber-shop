import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { assertCanEditBarberBySlug } from '@/lib/auth/ownership';

type Params = { params: Promise<{ slug: string }> };

const assignSchema = z.object({
  serviceIds: z.array(z.string().uuid()).max(50),
});

// Owner: which services this barber is assigned to perform.
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { slug } = await params;
    const barber = await assertCanEditBarberBySlug(slug, userId);

    const rows = await prisma.barberService.findMany({
      where: { barberId: barber.id },
      select: { serviceId: true },
    });
    return ok({ serviceIds: rows.map((r) => r.serviceId) });
  } catch (err) {
    return errorResponse(err);
  }
}

// Owner: replace the barber's service assignments.
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { slug } = await params;
    const barber = await assertCanEditBarberBySlug(slug, userId);

    const { serviceIds } = assignSchema.parse(await req.json());

    // Assignable services: the shop's catalog (shop barbers) or own catalog.
    if (serviceIds.length > 0) {
      const valid = await prisma.service.count({
        where: {
          id: { in: serviceIds },
          OR: [
            { ownerBarberId: barber.id },
            ...(barber.shopId ? [{ shopId: barber.shopId }] : []),
          ],
        },
      });
      if (valid !== serviceIds.length) {
        throw new HttpError(400, 'INVALID_SERVICES', 'Some services are not in this catalog.');
      }
    }

    await prisma.$transaction([
      prisma.barberService.deleteMany({ where: { barberId: barber.id } }),
      prisma.barberService.createMany({
        data: serviceIds.map((serviceId) => ({ barberId: barber.id, serviceId })),
      }),
    ]);

    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
