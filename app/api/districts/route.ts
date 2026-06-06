import { errorResponse, ok } from '@/lib/http';
import { listDistricts } from '@/lib/queries/districts';

// Public: Yerevan districts for discovery filters.
export async function GET() {
  try {
    return ok({ districts: await listDistricts() });
  } catch (err) {
    return errorResponse(err);
  }
}
