import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireRole } from '@/lib/auth/rbac';

type Params = { params: Promise<{ slug: string }> };
const schema = z.object({ isVerified: z.boolean().optional(), isFeatured: z.boolean().optional() });

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await requireRole('admin');
    const { slug } = await params;
    const data = schema.parse(await req.json());
    await prisma.shop.update({ where: { slug }, data });
    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
