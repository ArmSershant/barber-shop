import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireRole } from '@/lib/auth/rbac';

type Params = { params: Promise<{ id: string }> };
const schema = z.object({ status: z.enum(['active', 'suspended']) });

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireRole('admin');
    const { id } = await params;
    if (id === admin.userId) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'You cannot change your own status.');
    }
    const { status } = schema.parse(await req.json());
    await prisma.user.update({ where: { id }, data: { status } });
    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
