export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json(null);
  return NextResponse.json({ uid: session.uid, email: session.email, name: session.name, role: session.role });
}
