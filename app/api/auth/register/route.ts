import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import db from '@/lib/db';
import { hashPassword, signToken, COOKIE_NAME_EXPORT } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email va parolni kiriting" }, { status: 400 });
  }

  const [existing] = await db.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    return NextResponse.json({ error: "Bu email allaqachon ro'yxatdan o'tgan!" }, { status: 400 });
  }

  const id          = randomUUID();
  const hash        = await hashPassword(password);
  const displayName = name?.trim() || email.split('@')[0];

  await db.query(
    'INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
    [id, email, hash, displayName, 'student']
  );

  const token = signToken({ uid: id, email, name: displayName, role: 'student' });
  const res   = NextResponse.json({ uid: id, email, name: displayName, role: 'student' });
  res.cookies.set(COOKIE_NAME_EXPORT, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 30,
    path:     '/',
  });
  return res;
}
