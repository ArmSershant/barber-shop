import { errorResponse, ok } from '@/lib/http';
import { requireRole } from '@/lib/auth/rbac';
import { getProviderAnalytics } from '@/lib/queries/analytics';

export async function GET() {
  try {
    const { userId } = await requireRole('barber', 'shop_owner', 'admin');
    return ok(await getProviderAnalytics(userId));
  } catch (err) {
    return errorResponse(err);
  }
}
