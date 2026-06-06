import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireRole } from '@/lib/auth/rbac';

type Params = { params: Promise<{ slug: string }> };
const schema = z.object({ status: z.enum(['pending', 'active', 'suspended']) });

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await requireRole('admin');
    const { slug } = await params;
    const { status } = schema.parse(await req.json());
    await prisma.barber.update({ where: { slug }, data: { status } });
    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
