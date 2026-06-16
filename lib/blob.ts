import { del } from '@vercel/blob';

// Only touch URLs that live in our Vercel Blob store.
const OWNED_HOST = '.blob.vercel-storage.com';

/** Best-effort delete of a Blob file. No-ops for foreign/empty URLs or when unconfigured. */
export async function deleteBlob(url: string | null | undefined): Promise<void> {
  if (!url || !url.includes(OWNED_HOST) || !process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    await del(url);
  } catch (err) {
    console.error('[blob] delete failed:', err);
  }
}

/** Delete the previous file when an image field is being replaced with a different value. */
export async function deleteReplacedBlob(
  oldUrl: string | null | undefined,
  newUrl: string | null | undefined,
): Promise<void> {
  if (oldUrl && oldUrl !== newUrl) await deleteBlob(oldUrl);
}
