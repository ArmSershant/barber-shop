import { cookies } from 'next/headers';
import { verifyAccessToken, type Role } from '@/lib/auth/jwt';
import { ACCESS_COOKIE } from '@/lib/auth/tokens';

export interface CurrentUser {
  userId: string;
  roles: Role[];
}

/** Resolve the current user from the access-token cookie, or null if absent/invalid. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  try {
    const claims = await verifyAccessToken(token);
    return { userId: claims.sub, roles: claims.roles };
  } catch {
    return null; // expired or tampered
  }
}
