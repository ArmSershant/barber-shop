import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { assertCanEditBarberBySlug } from '@/lib/auth/ownership';

type Params = { params: Promise<{ slug: string }> };
const addSchema = z.object({ url: z.string().url() });
const MAX_IMAGES = 24;

// List the barber's portfolio images (owner-managed view).
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { slug } = await params;
    const barber = await assertCanEditBarberBySlug(slug, userId);
    const images = await prisma.portfolioImage.findMany({
      where: { barberId: barber.id },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, url: true },
    });
    return ok({ images });
  } catch (err) {
    return errorResponse(err);
  }
}

// Add a portfolio image (url already uploaded via /api/upload).
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { slug } = await params;
    const barber = await assertCanEditBarberBySlug(slug, userId);
    const { url } = addSchema.parse(await req.json());

    const count = await prisma.portfolioImage.count({ where: { barberId: barber.id } });
    const image = await prisma.portfolioImage.create({
      data: { barberId: barber.id, url, sortOrder: Math.min(count, MAX_IMAGES) },
      select: { id: true, url: true },
    });
    return ok({ image });
  } catch (err) {
    return errorResponse(err);
  }
}
