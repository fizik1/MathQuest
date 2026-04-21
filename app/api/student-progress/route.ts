export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json(null);

  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT * FROM student_progress WHERE student_id = ?', [session.uid]
  );
  return NextResponse.json(rows[0] || null);
}

export async function PUT(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });

  const body = await req.json();

  await db.query(
    `INSERT INTO student_progress
       (student_id, name, xp, level, streak, progress, topic_xp, watched_videos,
        unlocked_topics, exam_best_scores, unlocked_exams, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name             = VALUES(name),
       xp               = VALUES(xp),
       level            = VALUES(level),
       streak           = VALUES(streak),
       progress         = VALUES(progress),
       topic_xp         = VALUES(topic_xp),
       watched_videos   = VALUES(watched_videos),
       unlocked_topics  = VALUES(unlocked_topics),
       exam_best_scores = VALUES(exam_best_scores),
       unlocked_exams   = VALUES(unlocked_exams),
       updated_at       = VALUES(updated_at)`,
    [
      session.uid,
      body.name     || '',
      body.xp       || 0,
      body.level    || 1,
      body.streak   || 0,
      JSON.stringify(body.progress         || {}),
      JSON.stringify(body.topic_xp         || {}),
      JSON.stringify(body.watched_videos   || {}),
      JSON.stringify(body.unlocked_topics  || []),
      JSON.stringify(body.exam_best_scores || {}),
      JSON.stringify(body.unlocked_exams   || []),
      new Date().toISOString().slice(0, 19).replace('T', ' '),
    ]
  );

  return NextResponse.json({ ok: true });
}
