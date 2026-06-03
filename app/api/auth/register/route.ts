import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { registerSchema } from '@/lib/validation/auth';
import { hashPassword } from '@/lib/auth/password';
import { establishSession } from '@/lib/auth/tokens';
import { requestMeta } from '@/lib/request';
import type { Role } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, role } = registerSchema.parse(await req.json());

    const passwordHash = await hashPassword(password);

    const user = await prisma.user
      .create({
        data: {
          email,
          fullName,
          passwordHash,
          roles: { create: { role } },
        },
        select: { id: true, email: true, fullName: true },
      })
      .catch((e) => {
        // Unique violation on email.
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          throw new HttpError(409, 'EMAIL_TAKEN', 'An account with this email already exists.');
        }
        throw e;
      });

    const roles: Role[] = [role];
    const res = ok(
      { user: { id: user.id, email: user.email, fullName: user.fullName, roles } },
      { status: 201 },
    );
    await establishSession(res, user.id, roles, requestMeta(req));
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}
