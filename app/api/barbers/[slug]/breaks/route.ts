import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { assertCanEditBarberBySlug, requestStatusFor } from '@/lib/auth/ownership';
import { breakSchema } from '@/lib/validation/availability';

type Params = { params: Promise<{ slug: string }> };

// List the barber's recurring breaks.
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { slug } = await params;
    const barber = await assertCanEditBarberBySlug(slug, userId);

    const breaks = await prisma.break.findMany({
      where: { barberId: barber.id },
      orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }],
    });
    return ok({ breaks });
  } catch (err) {
    return errorResponse(err);
  }
}

// Add a recurring break (status depends on who is acting).
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { slug } = await params;
    const barber = await assertCanEditBarberBySlug(slug, userId);

    const data = breakSchema.parse(await req.json());
    const { status, requestedBy } = requestStatusFor(barber, userId);

    const created = await prisma.break.create({
      data: {
        barberId: barber.id,
        weekday: data.weekday ?? null,
        startMinute: data.startMinute,
        endMinute: data.endMinute,
        status,
        requestedBy,
      },
    });
    return ok({ break: created }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
