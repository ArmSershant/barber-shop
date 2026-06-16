import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';

type Params = { params: Promise<{ slug: string }> };

async function barberIdBySlug(slug: string): Promise<string> {
  const barber = await prisma.barber.findUnique({ where: { slug }, select: { id: true, deletedAt: true } });
  if (!barber || barber.deletedAt) throw new HttpError(404, 'BARBER_NOT_FOUND', 'Barber not found.');
  return barber.id;
}

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const barberId = await barberIdBySlug((await params).slug);
    await prisma.favorite.upsert({
      where: { userId_barberId: { userId, barberId } },
      create: { userId, barberId },
      update: {},
    });
    return ok({ favorited: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const barberId = await barberIdBySlug((await params).slug);
    await prisma.favorite.deleteMany({ where: { userId, barberId } });
    return ok({ favorited: false });
  } catch (err) {
    return errorResponse(err);
  }
}
