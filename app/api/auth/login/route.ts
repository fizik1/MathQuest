import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { comparePassword, signToken, COOKIE_NAME_EXPORT } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: string; email: string; password_hash: string; name: string; role: string;
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email va parolni kiriting" }, { status: 400 });
  }

  const [rows] = await db.query<UserRow[]>('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];

  if (!user || !(await comparePassword(password, user.password_hash))) {
    return NextResponse.json({ error: "Email yoki parol noto'g'ri!" }, { status: 401 });
  }

  const token = signToken({ uid: user.id, email: user.email, name: user.name, role: user.role });

  const res = NextResponse.json({ uid: user.id, email: user.email, name: user.name, role: user.role });
  res.cookies.set(COOKIE_NAME_EXPORT, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 30,
    path:     '/',
  });
  return res;
}
