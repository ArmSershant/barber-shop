// Provider-agnostic SMS sender. No-ops when unconfigured (like lib/email.ts),
// so dev and CI work without an SMS gateway.
//
// To go live, set SMS_API_URL + SMS_API_KEY (+ optional SMS_SENDER) and adjust
// the request payload below to match your chosen provider (local Armenian
// aggregator, Infobip, Vonage, Twilio, …). This is the only place to change.

interface SendSmsParams {
  to: string; // E.164 ideally, e.g. +37491234567
  body: string;
}

export async function sendSms({ to, body }: SendSmsParams): Promise<void> {
  // Master switch — SMS stays off until SMS_ENABLED=true, even if creds exist.
  // (Disabled for now to avoid gateway costs; flip on once there are real users.)
  if (process.env.SMS_ENABLED !== 'true') {
    return;
  }

  const apiKey = process.env.SMS_API_KEY;
  const endpoint = process.env.SMS_API_URL;
  const sender = process.env.SMS_SENDER || 'BarberShop';

  if (!apiKey || !endpoint) {
    console.info(`[sms] skipped (not configured) → ${to}`);
    return;
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      // Generic shape — remap keys to your provider's API when you pick one.
      body: JSON.stringify({ to, from: sender, text: body }),
    });
    if (!res.ok) console.error('[sms] send failed', res.status, await res.text());
  } catch (err) {
    console.error('[sms] send error', err);
  }
}
