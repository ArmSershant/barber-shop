import { SignJWT, jwtVerify } from 'jose';

export type Role = 'customer' | 'barber' | 'shop_owner' | 'admin';

export interface AccessClaims {
  sub: string; // user id
  roles: Role[];
}

const ACCESS_TTL = '15m';
const encoder = new TextEncoder();

function accessSecret(): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET is not set');
  return encoder.encode(secret);
}

export async function signAccessToken(claims: AccessClaims): Promise<string> {
  return new SignJWT({ roles: claims.roles })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(accessSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const { payload } = await jwtVerify(token, accessSecret());
  return { sub: payload.sub as string, roles: (payload.roles as Role[]) ?? [] };
}
