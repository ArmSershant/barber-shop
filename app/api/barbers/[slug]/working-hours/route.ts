import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { assertCanEditBarberBySlug } from '@/lib/auth/ownership';
import { workingHoursSchema } from '@/lib/validation/working-hours';

type Params = { params: Promise<{ slug: string }> };

// Public: a barber's weekly schedule (needed by the booking/availability UI).
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const barber = await prisma.barber.findUnique({ where: { slug }, select: { id: true } });
    const intervals = barber
      ? await prisma.workingHours.findMany({
          where: { barberId: barber.id },
          orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }],
          select: { weekday: true, startMinute: true, endMinute: true },
        })
      : [];
    return ok({ intervals });
  } catch (err) {
    return errorResponse(err);
  }
}

// Owner: replace the full weekly schedule.
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { slug } = await params;
    const barber = await assertCanEditBarberBySlug(slug, userId);

    const { intervals } = workingHoursSchema.parse(await req.json());

    await prisma.$transaction([
      prisma.workingHours.deleteMany({ where: { barberId: barber.id } }),
      prisma.workingHours.createMany({
        data: intervals.map((i) => ({
          barberId: barber.id,
          weekday: i.weekday,
          startMinute: i.startMinute,
          endMinute: i.endMinute,
        })),
      }),
    ]);

    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
