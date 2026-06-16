import { errorResponse, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';
import { getFavoriteBarbers } from '@/lib/queries/favorites';

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const barbers = await getFavoriteBarbers(userId);
    return ok({ barbers, slugs: barbers.map((b) => b.slug) });
  } catch (err) {
    return errorResponse(err);
  }
}
