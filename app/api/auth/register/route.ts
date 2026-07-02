import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { registerSchema } from '@/lib/validation/auth';
import { hashPassword } from '@/lib/auth/password';
import { establishSession } from '@/lib/auth/tokens';
import { createAuthToken } from '@/lib/auth/verification';
import { sendEmail } from '@/lib/email';
import { verifyEmailEmail } from '@/lib/email-templates';
import { syncNewsletterContact } from '@/lib/newsletter';
import { requestMeta } from '@/lib/request';
import { enforceRateLimit } from '@/lib/rate-limit';
import type { Role } from '@/lib/auth/jwt';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barber-shop.am';

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'register', 5, 60);
    const { email, password, fullName, role, newsletterOptIn } = registerSchema.parse(await req.json());
    const locale = req.cookies.get('NEXT_LOCALE')?.value ?? 'hy';

    const passwordHash = await hashPassword(password);

    const user = await prisma.user
      .create({
        data: {
          email,
          fullName,
          passwordHash,
          roles: { create: { role } },
          newsletterOptIn: newsletterOptIn ?? false,
          newsletterLang: newsletterOptIn ? locale : null,
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

    // Send a verification email (best-effort; account is usable meanwhile).
    try {
      const raw = await createAuthToken(user.id, 'email_verify');
      const { subject, html } = verifyEmailEmail(locale, `${appUrl}/verify-email?token=${raw}`);
      await sendEmail({ to: user.email, subject, html });
    } catch (verifyErr) {
      console.error('Failed to send verification email:', verifyErr);
    }

    // Add to the newsletter audience if they opted in (best-effort).
    if (newsletterOptIn) {
      void syncNewsletterContact({
        email: user.email,
        fullName: user.fullName,
        optIn: true,
        lang: locale,
        roles: [role],
      });
    }

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
