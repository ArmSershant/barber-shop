import { NextRequest } from 'next/server';
import { put } from '@vercel/blob';
import { errorResponse, HttpError, ok } from '@/lib/http';
import { requireAuth } from '@/lib/auth/rbac';

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// Authenticated image upload → Vercel Blob. Returns the public URL to store
// on the barber/shop. No-ops with a clear error if Blob isn't configured.
export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new HttpError(503, 'UPLOAD_UNAVAILABLE', 'Image uploads are not configured.');
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'No file provided.');
    }

    const ext = ALLOWED[file.type];
    if (!ext) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Unsupported image type (use JPEG, PNG, or WebP).');
    }
    if (file.size > MAX_BYTES) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Image is too large (max 4 MB).');
    }

    const blob = await put(`uploads/${crypto.randomUUID()}.${ext}`, file, {
      access: 'public',
      contentType: file.type,
    });

    return ok({ url: blob.url });
  } catch (err) {
    return errorResponse(err);
  }
}
