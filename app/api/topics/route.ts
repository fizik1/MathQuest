import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET — barcha mavzularni qaytarish
export async function GET() {
  const [rows] = await db.query('SELECT * FROM topics ORDER BY sort_order ASC');
  return NextResponse.json(rows);
}

// PUT — barcha mavzularni upsert qilish (admin)
export async function PUT(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  const rows: Record<string, unknown>[] = await req.json();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    for (const row of rows) {
      await conn.query(
        `INSERT INTO topics (id, title, icon, theory, quizzes, videos, materials, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title      = VALUES(title),
           icon       = VALUES(icon),
           theory     = VALUES(theory),
           quizzes    = VALUES(quizzes),
           videos     = VALUES(videos),
           materials  = VALUES(materials),
           sort_order = VALUES(sort_order),
           updated_at = VALUES(updated_at)`,
        [
          row.id, row.title, row.icon || '📚', row.theory || '',
          JSON.stringify(row.quizzes  || []),
          JSON.stringify(row.videos   || []),
          JSON.stringify(row.materials || []),
          row.sort_order ?? 0,
          new Date().toISOString().slice(0, 19).replace('T', ' '),
        ]
      );
    }
    await conn.commit();
    return NextResponse.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    const msg = e instanceof Error ? e.message : String(e);
    console.error('topics upsert error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    conn.release();
  }
}
