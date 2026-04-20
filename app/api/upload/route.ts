import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const topicId = (formData.get('topicId') as string) || 'general';

    if (!file) return NextResponse.json({ error: 'Fayl topilmadi' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = file.name.replace(/[^a-zA-Z0-9._\-\u0400-\u04FF]/g, '_');
    const filename = `${Date.now()}_${safeName}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'materials', topicId);
    await mkdir(uploadDir, { recursive: true });

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const url = `/uploads/materials/${topicId}/${filename}`;
    const storagePath = path.relative(path.join(process.cwd(), 'public'), filepath);

    return NextResponse.json({ url, storagePath });
  } catch (e) {
    console.error('Upload error:', e);
    return NextResponse.json({ error: 'Yuklashda xatolik' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { storagePath } = await request.json();
    if (!storagePath) return NextResponse.json({ ok: true });

    // Prevent directory traversal
    const normalized = path.normalize(storagePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.join(process.cwd(), 'public', normalized);

    await unlink(fullPath);
    return NextResponse.json({ ok: true });
  } catch {
    // File might not exist — treat as success
    return NextResponse.json({ ok: true });
  }
}
