'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppUser, Topic, Materials, StudentProgress, Exam } from '@/lib/types';
import { videoKey } from '@/lib/utils';
import {
  getSession, getTopics, getMaterials, getStudentProgress, saveStudentProgress, getExams,
} from '@/lib/api';
import StudentLayout      from '@/components/student/StudentLayout';
import StudentDashboard   from '@/components/student/StudentDashboard';
import StudentTopics      from '@/components/student/StudentTopics';
import StudentVideos      from '@/components/student/StudentVideos';
import StudentLeaderboard from '@/components/student/StudentLeaderboard';
import StudentProfile     from '@/components/student/StudentProfile';
import ExamList           from '@/components/student/ExamList';
import ExamSession        from '@/components/student/ExamSession';

export type StudentPage = 'dashboard' | 'topics' | 'videos' | 'imtihonlar' | 'leaderboard' | 'profile';

const DEFAULT_PROGRESS: StudentProgress = {
  xp: 0, level: 1, streak: 0,
  progress: {}, topicXP: {}, watchedVideos: {},
  unlockedTopics: [], examBestScores: {}, unlockedExams: [],
  name: '',
};

export default function StudentPage() {
  const router = useRouter();
  const [user,       setUser]       = useState<AppUser | null>(null);
  const [topics,     setTopics]     = useState<Topic[]>([]);
  const [materials,  setMaterials]  = useState<Materials>({});
  const [exams,      setExams]      = useState<Exam[]>([]);
  const [prog,       setProg]       = useState<StudentProgress>(DEFAULT_PROGRESS);
  const [page,       setPage]       = useState<StudentPage>('dashboard');
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [saving,     setSaving]     = useState(false);

  // ── Save ──────────────────────────────────────────────────────
  const saveProgress = useCallback(async (uid: string, name: string, next: StudentProgress) => {
    setSaving(true);
    const updated = { ...next, level: Math.floor(next.xp / 100) + 1, name };
    try {
      localStorage.setItem(`mq_student_v2_${uid}`, JSON.stringify(updated));
      await saveStudentProgress({
        name,
        xp:              updated.xp,
        level:           updated.level,
        streak:          updated.streak,
        progress:        updated.progress,
        topic_xp:        updated.topicXP,
        watched_videos:  updated.watchedVideos,
        unlocked_topics: updated.unlockedTopics,
        exam_best_scores: updated.examBestScores,
        unlocked_exams:  updated.unlockedExams,
      });
      setProg(updated);
    } finally {
      setSaving(false);
    }
  }, []);

  // ── Load ──────────────────────────────────────────────────────
  const loadData = useCallback(async (uid: string) => {
    const [examData, ts, mats, sp] = await Promise.all([
      getExams(),
      getTopics(),
      getMaterials(),
      getStudentProgress(),
    ]);

    setExams(examData as Exam[]);
    setTopics(ts as Topic[]);
    setMaterials(mats as Materials);
    localStorage.setItem('mq_admin_v2', JSON.stringify({ topics: ts, materials: mats }));

    if (sp) {
      setProg(sp as StudentProgress);
    } else {
      const cached = localStorage.getItem(`mq_student_v2_${uid}`);
      if (cached) { setProg(JSON.parse(cached)); }
    }
  }, []);

  // ── Auth ──────────────────────────────────────────────────────
  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.replace('/'); return; }
      if (session.role === 'admin') { router.replace('/admin'); return; }
      const u: AppUser = { uid: session.uid, email: session.email, role: 'student', name: session.name };
      setUser(u);
      await loadData(u.uid);
    });
  }, [router, loadData]);

  // Unlock first topic for new student
  useEffect(() => {
    if (topics.length > 0 && prog.unlockedTopics.length === 0 && user) {
      setProg(p => ({ ...p, unlockedTopics: [topics[0].id] }));
    }
  }, [topics.length, prog.unlockedTopics.length, user]); // eslint-disable-line

  if (!user) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', flexDirection: 'column', gap: '1rem',
        background: 'var(--bg-main)',
      }}>
        <div className="spinner" style={{ width: 44, height: 44, borderWidth: 3 }} />
        <p className="text-muted" style={{ fontWeight: 600 }}>Yuklanmoqda...</p>
      </div>
    );
  }

  // ── Quiz complete ─────────────────────────────────────────────
  async function handleQuizComplete(topicId: string, score: number, total: number): Promise<number> {
    const pct    = Math.round((score / total) * 100);
    const earned = score * 10;
    const prevXP = prog.topicXP[topicId] || 0;
    const xpToAdd = Math.max(0, earned - prevXP);

    const newProgress = { ...prog.progress };
    if (pct > (newProgress[topicId] || 0)) newProgress[topicId] = pct;

    const newTopicXP = { ...prog.topicXP };
    if (earned > prevXP) newTopicXP[topicId] = earned;

    let newUnlocked = [...prog.unlockedTopics];
    if (pct >= 70) {
      const idx = topics.findIndex(t => t.id === topicId);
      if (idx !== -1 && idx + 1 < topics.length && !newUnlocked.includes(topics[idx + 1].id)) {
        newUnlocked = [...newUnlocked, topics[idx + 1].id];
      }
    }

    const next: StudentProgress = { ...prog, xp: prog.xp + xpToAdd, progress: newProgress, topicXP: newTopicXP, unlockedTopics: newUnlocked };
    await saveProgress(user!.uid, user!.name, next);
    return xpToAdd;
  }

  // ── Watch video ───────────────────────────────────────────────
  async function handleWatchVideo(topicId: string, videoIndex: number): Promise<number> {
    const key = videoKey(topicId, videoIndex);
    if (prog.watchedVideos[key]) return 0;
    const topic = topics.find(t => t.id === topicId);
    const xp    = topic?.videos?.[videoIndex]?.xp || 20;
    const next: StudentProgress = { ...prog, xp: prog.xp + xp, watchedVideos: { ...prog.watchedVideos, [key]: true } };
    await saveProgress(user!.uid, user!.name, next);
    return xp;
  }

  // ── Exam complete ─────────────────────────────────────────────
  async function handleExamComplete(exam: Exam, score: number, total: number, timeTaken: number): Promise<number> {
    const pct      = Math.round((score / total) * 100);
    const passed   = pct >= exam.passingScore;
    const xpEarned = score * 15;
    const prevBest = prog.examBestScores[exam.id] || 0;
    const xpToAdd  = Math.max(0, xpEarned - prevBest);

    const newBestScores = { ...prog.examBestScores };
    if (pct > (newBestScores[exam.id] || 0)) newBestScores[exam.id] = pct;

    let newUnlockedExams = [...prog.unlockedExams];
    if (passed) {
      const idx = exams.findIndex(e => e.id === exam.id);
      if (idx !== -1 && idx + 1 < exams.length && !newUnlockedExams.includes(exams[idx + 1].id)) {
        newUnlockedExams = [...newUnlockedExams, exams[idx + 1].id];
      }
    }

    const next: StudentProgress = { ...prog, xp: prog.xp + xpToAdd, examBestScores: newBestScores, unlockedExams: newUnlockedExams };
    await saveProgress(user!.uid, user!.name, next);
    return xpToAdd;
  }

  // ── Render ────────────────────────────────────────────────────
  function renderPage() {
    switch (page) {
      case 'dashboard':
        return (
          <StudentDashboard
            xp={prog.xp} level={prog.level} streak={prog.streak}
            topics={topics} progress={prog.progress}
            onNavigate={p => { setActiveExam(null); setPage(p as StudentPage); }}
          />
        );
      case 'topics':
        return (
          <StudentTopics
            topics={topics} materials={materials}
            unlockedTopics={prog.unlockedTopics}
            progress={prog.progress}
            topicXP={prog.topicXP}
            watchedVideos={prog.watchedVideos}
            onQuizComplete={handleQuizComplete}
            onWatchVideo={handleWatchVideo}
          />
        );
      case 'videos':
        return (
          <StudentVideos
            topics={topics}
            watchedVideos={prog.watchedVideos}
            onWatchVideo={handleWatchVideo}
          />
        );
      case 'imtihonlar':
        if (activeExam) {
          return (
            <ExamSession
              exam={activeExam} topics={topics}
              onComplete={handleExamComplete}
              onBack={() => setActiveExam(null)}
            />
          );
        }
        return (
          <ExamList
            exams={exams} examBestScores={prog.examBestScores}
            unlockedExams={prog.unlockedExams}
            onStart={exam => setActiveExam(exam)}
          />
        );
      case 'leaderboard':
        return <StudentLeaderboard user={user!} />;
      case 'profile':
        return (
          <StudentProfile
            user={user!} xp={prog.xp} level={prog.level}
            streak={prog.streak} topics={topics} progress={prog.progress}
          />
        );
    }
  }

  return (
    <StudentLayout
      user={user} currentPage={page}
      xp={prog.xp} level={prog.level} streak={prog.streak}
      saving={saving}
      onNavigate={p => { setActiveExam(null); setPage(p as StudentPage); }}
    >
      {renderPage()}
    </StudentLayout>
  );
}
