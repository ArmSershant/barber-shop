import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { enforceRateLimit } from '@/lib/rate-limit';

type Params = { params: Promise<{ slug: string }> };

const schema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

// A logged-in customer joins the waitlist for a barber's full day.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    await enforceRateLimit(req, 'waitlist', 20, 60);
    const { userId } = await requireAuth();
    const { slug } = await params;
    const { date } = schema.parse(await req.json());

    const barber = await prisma.barber.findUnique({
      where: { slug },
      select: {
        id: true,
        deletedAt: true,
        waitlistEnabled: true,
        shopId: true,
        shop: { select: { waitlistEnabled: true } },
      },
    });
    if (!barber || barber.deletedAt) throw new HttpError(404, 'BARBER_NOT_FOUND', 'Barber not found.');

    const enabled = barber.shopId && barber.shop ? barber.shop.waitlistEnabled : barber.waitlistEnabled;
    if (!enabled) throw new HttpError(400, 'WAITLIST_DISABLED', 'Waitlist is not available here.');

    await prisma.waitlistEntry.upsert({
      where: { barberId_userId_date: { barberId: barber.id, userId, date } },
      create: { barberId: barber.id, userId, date },
      update: { notifiedAt: null }, // re-arm if they re-join after a prior notify
    });

    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
