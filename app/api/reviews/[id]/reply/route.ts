import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ reply: z.string().trim().max(1000) });

// Provider replies to a review on their own profile (barber's user, the shop
// owner, or an admin). An empty string clears the reply.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { userId, roles } = await requireAuth();
    const { id } = await params;
    const { reply } = schema.parse(await req.json());

    const review = await prisma.review.findUnique({
      where: { id },
      select: { id: true, barber: { select: { userId: true, shop: { select: { ownerUserId: true } } } } },
    });
    if (!review) throw new HttpError(404, 'REVIEW_NOT_FOUND', 'Review not found.');

    const isAdmin = roles.includes('admin');
    const isOwn = review.barber.userId === userId;
    const ownsShop = review.barber.shop?.ownerUserId === userId;
    if (!isAdmin && !isOwn && !ownsShop) {
      throw new HttpError(403, 'FORBIDDEN', 'You cannot reply to this review.');
    }

    const trimmed = reply.trim();
    await prisma.review.update({
      where: { id },
      data: { reply: trimmed || null, repliedAt: trimmed ? new Date() : null },
    });

    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
