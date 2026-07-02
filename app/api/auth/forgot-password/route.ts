import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { forgotPasswordSchema } from '@/lib/validation/auth';
import { createAuthToken } from '@/lib/auth/verification';
import { sendEmail } from '@/lib/email';
import { passwordResetEmail } from '@/lib/email-templates';
import { enforceRateLimit } from '@/lib/rate-limit';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barber-shop.am';

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'forgot-password', 5, 300);
    const { email } = forgotPasswordSchema.parse(await req.json());
    const locale = req.cookies.get('NEXT_LOCALE')?.value;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, deletedAt: true },
    });

    // Only act for real, active, password-based accounts — but always respond
    // the same way so we don't reveal whether an email is registered.
    if (user && user.passwordHash && !user.deletedAt) {
      const raw = await createAuthToken(user.id, 'password_reset');
      const { subject, html } = passwordResetEmail(locale, `${appUrl}/reset-password?token=${raw}`);
      await sendEmail({ to: email, subject, html });
    }

    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
