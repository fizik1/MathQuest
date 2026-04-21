import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const [rows] = await db.query(
    'SELECT student_id, name, xp, level FROM student_progress ORDER BY xp DESC LIMIT 50'
  );
  return NextResponse.json(rows);
}
