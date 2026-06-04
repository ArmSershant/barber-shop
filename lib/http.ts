import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ZodError } from 'zod';
import { defaultLocale, LOCALE_COOKIE } from '@/i18n/config';
import en from '@/messages/en.json';
import hy from '@/messages/hy.json';
import ru from '@/messages/ru.json';

/**
 * Application error with an HTTP status and a stable machine-readable code.
 * Throw these from route handlers / guards; `errorResponse` turns them into
 * the standard error envelope, localized by code via the locale cookie.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

type Envelope = { error: { code: string; message: string; details?: unknown } };

function envelope(code: string, message: string, details?: unknown): Envelope {
  return { error: { code, message, ...(details !== undefined ? { details } : {}) } };
}

type ErrorCatalog = Record<string, string>;
const CATALOGS: Record<string, ErrorCatalog> = {
  en: (en as { apiErrors?: ErrorCatalog }).apiErrors ?? {},
  hy: (hy as { apiErrors?: ErrorCatalog }).apiErrors ?? {},
  ru: (ru as { apiErrors?: ErrorCatalog }).apiErrors ?? {},
};

/** Translate an error code using the request's locale cookie; fall back to the raw message. */
async function localized(code: string, fallback: string): Promise<string> {
  try {
    const locale = (await cookies()).get(LOCALE_COOKIE)?.value ?? defaultLocale;
    return CATALOGS[locale]?.[code] ?? CATALOGS.en[code] ?? fallback;
  } catch {
    return fallback;
  }
}

/** Success JSON response. */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/** Convert a thrown error into a consistent, localized JSON error response. */
export async function errorResponse(err: unknown): Promise<NextResponse> {
  if (err instanceof HttpError) {
    return NextResponse.json(
      envelope(err.code, await localized(err.code, err.message), err.details),
      { status: err.status },
    );
  }

  if (err instanceof ZodError) {
    return NextResponse.json(
      envelope(
        'VALIDATION_ERROR',
        await localized('VALIDATION_ERROR', 'Request body is invalid.'),
        err.flatten(),
      ),
      { status: 422 },
    );
  }

  // Unknown / unexpected: log server-side, hide details from the client.
  console.error('Unhandled API error:', err);
  const debug =
    process.env.NODE_ENV !== 'production'
      ? { debug: err instanceof Error ? err.message : String(err) }
      : undefined;
  return NextResponse.json(
    envelope('INTERNAL', await localized('INTERNAL', 'Something went wrong.'), debug),
    { status: 500 },
  );
}
