import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireRole } from '@/lib/auth/rbac';
import { createBarberSchema } from '@/lib/validation/provider';
import { generateUniqueSlug } from '@/lib/slug';
import { listBarbers } from '@/lib/queries/barbers';

// Public: list barbers for discovery (optional ?q= name search).
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q') ?? undefined;
    const barbers = await listBarbers({ q });
    return ok({ barbers });
  } catch (err) {
    return errorResponse(err);
  }
}

// Independent barber creates their own profile (linked to their user). One per user.
export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireRole('barber', 'admin');

    const existing = await prisma.barber.findUnique({ where: { userId } });
    if (existing) throw new HttpError(409, 'BARBER_EXISTS', 'You already have a barber profile.');

    const data = createBarberSchema.parse(await req.json());
    const slug = await generateUniqueSlug(
      data.displayName,
      'barber',
      async (s) => Boolean(await prisma.barber.findUnique({ where: { slug: s }, select: { id: true } })),
    );

    const barber = await prisma.barber.create({
      data: { ...data, slug, userId },
    });

    return ok({ barber }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
