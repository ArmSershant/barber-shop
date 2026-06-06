import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireRole } from '@/lib/auth/rbac';
import { recomputeBarberRating } from '@/lib/queries/admin';

type Params = { params: Promise<{ id: string }> };
const schema = z.object({ hidden: z.boolean() });

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await requireRole('admin');
    const { id } = await params;
    const { hidden } = schema.parse(await req.json());

    const review = await prisma.review.update({
      where: { id },
      data: { isHidden: hidden },
      select: { barberId: true },
    });

    // Hidden reviews are excluded from the rating aggregate.
    await recomputeBarberRating(review.barberId);
    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
