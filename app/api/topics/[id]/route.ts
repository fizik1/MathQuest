import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  await db.query('DELETE FROM topics WHERE id = ?', [params.id]);
  return NextResponse.json({ ok: true });
}
