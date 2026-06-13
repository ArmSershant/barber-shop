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

    const image = await prisma.portfolioImage.findUnique({ where: { id }, select: { barberId: true } });
    if (!image || image.barberId !== barber.id) {
      throw new HttpError(404, 'NOT_FOUND', 'Image not found.');
    }
    await prisma.portfolioImage.delete({ where: { id } });
    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
