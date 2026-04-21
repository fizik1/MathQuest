export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const [rows] = await db.query('SELECT * FROM exams ORDER BY sort_order ASC');
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  const exam = await req.json();
  await db.query(
    `INSERT INTO exams (id, title, description, topic_id, question_count, time_limit_minutes, passing_score, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      exam.id, exam.title, exam.description || '',
      exam.topicId || 'all',
      exam.questionCount     || 10,
      exam.timeLimitMinutes  || 20,
      exam.passingScore      || 70,
      exam.sort_order        || 0,
      (exam.created_at || new Date().toISOString()).slice(0, 19).replace('T', ' '),
    ]
  );
  return NextResponse.json({ ok: true });
}
