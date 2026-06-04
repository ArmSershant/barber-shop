import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { loadStartedProviderBooking } from '@/lib/queries/provider-booking';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    await loadStartedProviderBooking(id, userId);

    await prisma.booking.update({ where: { id }, data: { status: 'no_show' } });
    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
