import { errorResponse, ok } from '@/lib/http';
import { requireRole } from '@/lib/auth/rbac';
import { getAdminOverview } from '@/lib/queries/admin';

export async function GET() {
  try {
    await requireRole('admin');
    return ok(await getAdminOverview());
  } catch (err) {
    return errorResponse(err);
  }
}
