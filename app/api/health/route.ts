import { NextResponse } from 'next/server';

// Lightweight liveness probe. Does not touch the DB so it stays green
// even before the database is provisioned.
export function GET() {
  return NextResponse.json({ status: 'ok', service: 'barber-shop', time: new Date().toISOString() });
}
