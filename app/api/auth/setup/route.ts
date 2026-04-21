// Birinchi admin foydalanuvchini yaratish uchun (bir marta ishlatiladi)
// POST /api/auth/setup
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import db from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

export async function POST() {
  const email    = process.env.SETUP_ADMIN_EMAIL;
  const password = process.env.SETUP_ADMIN_PASSWORD;
  const name     = process.env.SETUP_ADMIN_NAME || 'Admin';

  if (!email || !password) {
    return NextResponse.json(
      { error: 'SETUP_ADMIN_EMAIL va SETUP_ADMIN_PASSWORD env larni .env.local ga qo\'ying' },
      { status: 400 }
    );
  }

  const [admins] = await db.query<RowDataPacket[]>('SELECT id FROM users WHERE role = ?', ['admin']);
  if (admins.length > 0) {
    return NextResponse.json({ error: 'Admin allaqachon mavjud' }, { status: 400 });
  }

  const id   = randomUUID();
  const hash = await hashPassword(password);
  await db.query(
    'INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
    [id, email, hash, name, 'admin']
  );

  return NextResponse.json({ ok: true, message: `Admin yaratildi: ${email}` });
}
