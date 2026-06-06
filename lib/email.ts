// Minimal transactional email via Resend's HTTP API (no SDK dependency).
// No-ops gracefully when EMAIL_API_KEY is unset, so dev works without email.

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM || 'Barber-Shop <onboarding@resend.dev>';

  if (!apiKey) {
    console.info(`[email] skipped (no EMAIL_API_KEY) → ${subject} → ${to}`);
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      console.error('[email] send failed', res.status, await res.text());
    }
  } catch (err) {
    console.error('[email] send error', err);
  }
}
