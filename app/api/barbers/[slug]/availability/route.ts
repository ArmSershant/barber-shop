import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { getAvailableSlots, getServiceTotals } from '@/lib/queries/availability';

type Params = { params: Promise<{ slug: string }> };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_DURATION_MIN = 30;

// Public: available booking slots for a barber on a given local day.
// ?date=YYYY-MM-DD (required) & serviceIds=id1,id2 (optional → sums duration)
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const date = req.nextUrl.searchParams.get('date');
    if (!date || !DATE_RE.test(date)) {
      throw new HttpError(400, 'BAD_DATE', 'Provide ?date=YYYY-MM-DD.');
    }

    const barber = await prisma.barber.findUnique({
      where: { slug },
      select: {
        id: true,
        shopId: true,
        timezone: true,
        slotGranularityMin: true,
        defaultBufferMin: true,
        deletedAt: true,
      },
    });
    if (!barber || barber.deletedAt) throw new HttpError(404, 'BARBER_NOT_FOUND', 'Barber not found.');

    const serviceIds = (req.nextUrl.searchParams.get('serviceIds') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const totals = await getServiceTotals(barber, serviceIds);
    const durationMin = totals.durationMin > 0 ? totals.durationMin : DEFAULT_DURATION_MIN;

    const slots = await getAvailableSlots({
      barberId: barber.id,
      timezone: barber.timezone,
      slotGranularityMin: barber.slotGranularityMin,
      defaultBufferMin: barber.defaultBufferMin,
      date,
      durationMin,
    });

    return ok({
      date,
      durationMin,
      priceAmd: totals.priceAmd,
      slots,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
