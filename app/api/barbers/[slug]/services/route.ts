import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { assertCanEditBarberBySlug } from '@/lib/auth/ownership';

type Params = { params: Promise<{ slug: string }> };

const assignSchema = z.object({
  assignments: z
    .array(
      z.object({
        serviceId: z.string().uuid(),
        priceAmdOverride: z.number().int().min(0).max(10_000_000).nullable().optional(),
        durationMinOverride: z.number().int().min(5).max(600).nullable().optional(),
      }),
    )
    .max(50),
});

// Owner: which services this barber performs (+ per-barber overrides).
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { slug } = await params;
    const barber = await assertCanEditBarberBySlug(slug, userId);

    const assignments = await prisma.barberService.findMany({
      where: { barberId: barber.id },
      select: { serviceId: true, priceAmdOverride: true, durationMinOverride: true },
    });
    return ok({ assignments });
  } catch (err) {
    return errorResponse(err);
  }
}

// Owner: replace the barber's service assignments (with optional overrides).
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { slug } = await params;
    const barber = await assertCanEditBarberBySlug(slug, userId);

    const { assignments } = assignSchema.parse(await req.json());
    const serviceIds = assignments.map((a) => a.serviceId);

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
        data: assignments.map((a) => ({
          barberId: barber.id,
          serviceId: a.serviceId,
          priceAmdOverride: a.priceAmdOverride ?? null,
          durationMinOverride: a.durationMinOverride ?? null,
        })),
      }),
    ]);

    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
