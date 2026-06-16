import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { verifyEmailSchema } from '@/lib/validation/auth';
import { consumeAuthToken } from '@/lib/auth/verification';

export async function POST(req: NextRequest) {
  try {
    const { token } = verifyEmailSchema.parse(await req.json());
    const userId = await consumeAuthToken(token, 'email_verify');
    await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
