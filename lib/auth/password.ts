import { hash, verify } from '@node-rs/argon2';

// Argon2id parameters. Defaults are sensible; pinned here so they're explicit
// and can be tuned. memoryCost is in KiB.
const options = {
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, options);
}

export async function verifyPassword(hashed: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashed, plain, options);
  } catch {
    // Malformed hash, etc. — treat as a failed verification, never throw.
    return false;
  }
}
