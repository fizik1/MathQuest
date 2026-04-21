// Client-side API helpers — barchasi fetch orqali ishlaydi

function jp(v: unknown): unknown {
  if (typeof v === 'string') try { return JSON.parse(v); } catch { /* noop */ }
  return v;
}

// ── Auth ───────────────────────────────────────────────────────────────────

export async function getSession(): Promise<{ uid: string; email: string; name: string; role: string } | null> {
  const res = await fetch('/api/auth/session');
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Kirish xatoligi');
  return data;
}

export async function register(email: string, password: string, name: string) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ro'yxatdan o'tish xatoligi");
  return data;
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
}

// ── Topics ─────────────────────────────────────────────────────────────────

export async function getTopics() {
  const res = await fetch('/api/topics');
  const rows: Record<string, unknown>[] = await res.json();
  return rows.map(r => ({
    id:         r.id        as string,
    title:      r.title     as string,
    icon:       (r.icon     as string) || '📚',
    theory:     (r.theory   as string) || '',
    quizzes:    (jp(r.quizzes)   as unknown[]) || [],
    videos:     (jp(r.videos)    as unknown[]) || [],
    sort_order: (r.sort_order as number) || 0,
  }));
}

export async function getMaterials(): Promise<Record<string, unknown[]>> {
  const res = await fetch('/api/topics');
  const rows: Record<string, unknown>[] = await res.json();
  const mats: Record<string, unknown[]> = {};
  rows.forEach(r => {
    mats[r.id as string] = (jp(r.materials) as unknown[]) || [];
  });
  return mats;
}

export async function saveTopics(rows: {
  id: string; title: string; icon: string; theory: string;
  quizzes: unknown[]; videos: unknown[];
  materials?: unknown[]; sort_order: number;
}[]) {
  const res = await fetch('/api/topics', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error('Topics saqlashda xatolik');
}

export async function deleteTopic(id: string) {
  const res = await fetch(`/api/topics/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error("Topic o'chirishda xatolik");
}

// ── Student progress ───────────────────────────────────────────────────────

export async function getStudentProgress() {
  const res = await fetch('/api/student-progress');
  const data: Record<string, unknown> | null = await res.json();
  if (!data) return null;
  return {
    xp:             (data.xp      as number) || 0,
    level:          (data.level   as number) || 1,
    streak:         (data.streak  as number) || 0,
    progress:       (jp(data.progress)        as Record<string, number>)  || {},
    topicXP:        (jp(data.topic_xp)        as Record<string, number>)  || {},
    watchedVideos:  (jp(data.watched_videos)  as Record<string, boolean>) || {},
    unlockedTopics: (jp(data.unlocked_topics) as string[])                || [],
    examBestScores: (jp(data.exam_best_scores) as Record<string, number>) || {},
    unlockedExams:  (jp(data.unlocked_exams)  as string[])                || [],
    name:           (data.name as string) || '',
  };
}

export async function saveStudentProgress(data: {
  name: string; xp: number; level: number; streak: number;
  progress: Record<string, number>;
  topic_xp: Record<string, number>;
  watched_videos: Record<string, boolean>;
  unlocked_topics: string[];
  exam_best_scores: Record<string, number>;
  unlocked_exams: string[];
}) {
  const res = await fetch('/api/student-progress', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Progress saqlashda xatolik');
}

// ── Exams ──────────────────────────────────────────────────────────────────

export async function getExams() {
  const res = await fetch('/api/exams');
  const rows: Record<string, unknown>[] = await res.json();
  return rows.map(r => ({
    id:                r.id                as string,
    title:             r.title             as string,
    description:       (r.description      as string) || '',
    topicId:           (r.topic_id         as string) || 'all',
    questionCount:     (r.question_count   as number) || 10,
    timeLimitMinutes:  (r.time_limit_minutes as number) || 20,
    passingScore:      (r.passing_score    as number) || 70,
    sort_order:        (r.sort_order       as number) || 0,
    created_at:        r.created_at        as string,
  }));
}

export async function addExam(exam: {
  id: string; title: string; description: string; topicId: string;
  questionCount: number; timeLimitMinutes: number; passingScore: number;
  sort_order: number; created_at: string;
}) {
  const res = await fetch('/api/exams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exam),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Imtihon qo'shishda xatolik");
}

export async function deleteExam(id: string) {
  const res = await fetch(`/api/exams/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error("Imtihon o'chirishda xatolik");
}

// ── Leaderboard ────────────────────────────────────────────────────────────

export async function getLeaderboard(): Promise<{ student_id: string; name: string; xp: number; level: number }[]> {
  const res = await fetch('/api/leaderboard');
  return res.json();
}
