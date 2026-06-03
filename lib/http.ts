import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Application error with an HTTP status and a stable machine-readable code.
 * Throw these from route handlers / guards; `errorResponse` turns them into
 * the standard error envelope.
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

/** Success JSON response. */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/** Convert a thrown error into a consistent JSON error response. */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof HttpError) {
    return NextResponse.json(envelope(err.code, err.message, err.details), { status: err.status });
  }

  if (err instanceof ZodError) {
    return NextResponse.json(
      envelope('VALIDATION_ERROR', 'Request body is invalid.', err.flatten()),
      { status: 422 },
    );
  }

  // Unknown / unexpected: log server-side, hide details from the client.
  console.error('Unhandled API error:', err);
  return NextResponse.json(envelope('INTERNAL', 'Something went wrong.'), { status: 500 });
}
