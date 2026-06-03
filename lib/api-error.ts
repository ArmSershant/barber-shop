/**
 * Pull a human-readable message out of an RTK Query error.
 * Our API returns `{ error: { code, message } }`, so we look for `data.error.message`.
 */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'error' in data) {
      const error = (data as { error?: { message?: unknown } }).error;
      if (error && typeof error.message === 'string') return error.message;
    }
  }
  return fallback;
}
