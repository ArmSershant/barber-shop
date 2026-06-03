import { errorResponse, ok } from '@/lib/http';
import { requireRole } from '@/lib/auth/rbac';

// Demo route guarding by role. A `customer` gets 403; a `barber`/`shop_owner`
// gets 200. Remove once real provider routes exist — it just proves RBAC works.
export async function GET() {
  try {
    const user = await requireRole('barber', 'shop_owner');
    return ok({ ok: true, message: 'Provider access granted', userId: user.userId });
  } catch (err) {
    return errorResponse(err);
  }
}
