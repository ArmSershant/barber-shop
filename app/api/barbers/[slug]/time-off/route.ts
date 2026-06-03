import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { assertCanEditBarberBySlug, requestStatusFor } from '@/lib/auth/ownership';
import { timeOffSchema } from '@/lib/validation/availability';

type Params = { params: Promise<{ slug: string }> };

// List the barber's time off (upcoming + ongoing).
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { slug } = await params;
    const barber = await assertCanEditBarberBySlug(slug, userId);

    const timeOff = await prisma.timeOff.findMany({
      where: { barberId: barber.id, endsAt: { gte: new Date() } },
      orderBy: { startsAt: 'asc' },
    });
    return ok({ timeOff });
  } catch (err) {
    return errorResponse(err);
  }
}

// Add a time-off block (status depends on who is acting).
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { slug } = await params;
    const barber = await assertCanEditBarberBySlug(slug, userId);

    const data = timeOffSchema.parse(await req.json());
    const { status, requestedBy } = requestStatusFor(barber, userId);

    const timeOff = await prisma.timeOff.create({
      data: {
        barberId: barber.id,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        reason: data.reason,
        status,
        requestedBy,
      },
    });
    return ok({ timeOff }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
