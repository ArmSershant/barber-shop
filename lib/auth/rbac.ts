import { HttpError } from '@/lib/http';
import { getCurrentUser, type CurrentUser } from '@/lib/auth/session';
import type { Role } from '@/lib/auth/jwt';

/** Require a logged-in user. Throws 401 otherwise. */
export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required.');
  return user;
}

/**
 * Require the user to hold at least one of the given roles. Throws 401 if not
 * logged in, 403 if logged in without a matching role.
 *
 * Note: this checks roles from the access token. Resource-level ownership
 * (e.g. "this is *your* shop") is enforced separately in each handler.
 */
export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await requireAuth();
  if (!user.roles.some((role) => roles.includes(role))) {
    throw new HttpError(403, 'FORBIDDEN', 'You do not have access to this resource.');
  }
  return user;
}
