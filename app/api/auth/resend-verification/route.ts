import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { createAuthToken } from '@/lib/auth/verification';
import { sendEmail } from '@/lib/email';
import { verifyEmailEmail } from '@/lib/email-templates';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barber-shop.am';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const locale = req.cookies.get('NEXT_LOCALE')?.value;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerified: true },
    });

    if (user && !user.emailVerified) {
      const raw = await createAuthToken(userId, 'email_verify');
      const { subject, html } = verifyEmailEmail(locale, `${appUrl}/verify-email?token=${raw}`);
      await sendEmail({ to: user.email, subject, html });
    }

    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
