import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { assertCanEditBarberBySlug } from '@/lib/auth/ownership';

type Params = { params: Promise<{ slug: string; id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { slug, id } = await params;
    const barber = await assertCanEditBarberBySlug(slug, userId);

    const existing = await prisma.timeOff.findUnique({ where: { id }, select: { barberId: true } });
    if (!existing || existing.barberId !== barber.id) {
      throw new HttpError(404, 'TIME_OFF_NOT_FOUND', 'Time off not found.');
    }

    await prisma.timeOff.delete({ where: { id } });
    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
