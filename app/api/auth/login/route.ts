import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { loginSchema } from '@/lib/validation/auth';
import { verifyPassword } from '@/lib/auth/password';
import { establishSession } from '@/lib/auth/tokens';
import { requestMeta } from '@/lib/request';
import { enforceRateLimit } from '@/lib/rate-limit';
import type { Role } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'login', 10, 60);
    const { email, password } = loginSchema.parse(await req.json());

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, fullName: true, passwordHash: true, status: true, roles: true },
    });

    // Same error whether the email is unknown or the password is wrong —
    // don't leak which accounts exist.
    const invalid = new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    if (!user || !user.passwordHash) throw invalid;
    if (!(await verifyPassword(user.passwordHash, password))) throw invalid;
    if (user.status === 'suspended') {
      throw new HttpError(403, 'ACCOUNT_SUSPENDED', 'This account is suspended.');
    }

    const roles = user.roles.map((r) => r.role) as Role[];
    const res = ok({ user: { id: user.id, email: user.email, fullName: user.fullName, roles } });
    await establishSession(res, user.id, roles, requestMeta(req));
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}
