'use client';
import { useState, useEffect, useCallback } from 'react';
import { Topic, Exam } from '@/lib/types';
import { getExams, addExam, deleteExam } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface Props { topics: Topic[]; }

export default function ExamManager({ topics }: Props) {
  const { toast } = useToast();
  const [exams,   setExams]   = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [topicId,     setTopicId]     = useState<string>('all');
  const [qCount,      setQCount]      = useState(10);
  const [timeLimit,   setTimeLimit]   = useState(20);
  const [passing,     setPassing]     = useState(70);

  const loadExams = useCallback(async () => {
    setLoading(true);
    setExams(await getExams());
    setLoading(false);
  }, []);

  useEffect(() => { loadExams(); }, [loadExams]);

  const maxQ = topicId === 'all'
    ? topics.reduce((s, t) => s + (t.quizzes?.length || 0), 0)
    : (topics.find(t => t.id === topicId)?.quizzes?.length || 0);

  async function handleAdd() {
    if (!title.trim()) { toast('Imtihon nomini kiriting!', 'warning'); return; }
    if (qCount < 1)    { toast('Savollar soni kamida 1!', 'warning'); return; }
    if (maxQ < qCount) { toast(`Bu mavzuda faqat ${maxQ} ta savol mavjud!`, 'warning'); return; }
    if (timeLimit < 1) { toast('Vaqt limiti kamida 1 daqiqa!', 'warning'); return; }
    if (passing < 1 || passing > 100) { toast("O'tish bali 1–100 orasida!", 'warning'); return; }

    setSaving(true);
    const exam: Exam = {
      id: `exam_${Date.now().toString(36)}`,
      title: title.trim(), description: description.trim(),
      topicId, questionCount: qCount, timeLimitMinutes: timeLimit,
      passingScore: passing, sort_order: exams.length,
      created_at: new Date().toISOString(),
    } as Required<Exam>;
    try {
      await addExam(exam as Required<Exam>);
      setExams(prev => [...prev, exam]);
      setTitle(''); setDescription(''); setTopicId('all'); setQCount(10); setTimeLimit(20); setPassing(70);
      toast("Imtihon qo'shildi! 📝");
    } catch (e) {
      toast('Xatolik: ' + (e instanceof Error ? e.message : ''), 'error');
    }
    setSaving(false);
  }

  async function handleRemove(id: string) {
    setSaving(true);
    try {
      await deleteExam(id);
      setExams(prev => prev.filter(e => e.id !== id));
      toast("Imtihon o'chirildi", 'info');
    } catch (e) {
      toast('Xatolik: ' + (e instanceof Error ? e.message : ''), 'error');
    }
    setConfirm(null);
    setSaving(false);
  }

  return (
    <div>
      <h1 className="view-title">Imtihonlar 📝</h1>
      <p className="view-subtitle">Imtihon yarating: vaqt limiti, savollar soni va o&apos;tish balini belgilang.</p>

      <div className="card admin-form-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>➕ Yangi imtihon qo&apos;shish</h3>

        <div className="form-grid">
          <div className="form-group">
            <label>Imtihon nomi *</label>
            <input type="text" className="form-input" placeholder="Masalan: 1-chorak imtihoni"
              value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Mavzu (manba)</label>
            <select className="form-input" value={topicId} onChange={e => setTopicId(e.target.value)}>
              <option value="all">Barcha mavzulardan</option>
              {topics.map(t => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.title} ({t.quizzes?.length || 0} savol)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Tavsif (ixtiyoriy)</label>
          <input type="text" className="form-input" placeholder="Imtihon haqida qisqacha..."
            value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="form-group">
            <label>Savollar soni</label>
            <input type="number" className="form-input" min={1} max={maxQ || 100}
              value={qCount} onChange={e => setQCount(Number(e.target.value))} />
            {maxQ > 0 && (
              <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Mavjud: {maxQ} ta savol
              </p>
            )}
          </div>
          <div className="form-group">
            <label>Vaqt limiti (daqiqa)</label>
            <input type="number" className="form-input" min={1} max={180}
              value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>O&apos;tish bali (%)</label>
            <input type="number" className="form-input" min={1} max={100}
              value={passing} onChange={e => setPassing(Number(e.target.value))} />
            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Tavsiya: 70%</p>
          </div>
        </div>

        <button className="primary-btn" onClick={handleAdd} disabled={saving || !title.trim()}>
          {saving
            ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saqlanmoqda...</>
            : "✅ Imtihon qo'shish"}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <div className="spinner" />
        </div>
      ) : exams.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">📝</div>
          <p>Hali imtihon qo&apos;shilmagan.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {exams.map((exam, idx) => {
            const src = exam.topicId === 'all'
              ? 'Barcha mavzular'
              : topics.find(t => t.id === exam.topicId)?.title || exam.topicId;
            return (
              <div key={exam.id} className="card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{idx + 1}. {exam.title}</span>
                  </div>
                  {exam.description && (
                    <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '0.4rem' }}>{exam.description}</p>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="pill pill-muted" style={{ fontSize: '0.7rem' }}>📚 {src}</span>
                    <span className="pill pill-muted" style={{ fontSize: '0.7rem' }}>❓ {exam.questionCount} savol</span>
                    <span className="pill pill-muted" style={{ fontSize: '0.7rem' }}>⏱️ {exam.timeLimitMinutes} daqiqa</span>
                    <span className="pill pill-success" style={{ fontSize: '0.7rem' }}>🎯 {exam.passingScore}% o&apos;tish</span>
                  </div>
                </div>

                {confirm === exam.id ? (
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>O&apos;chirilsinmi?</span>
                    <button className="btn-icon" style={{ background: 'var(--danger)', color: 'white', borderColor: 'var(--danger)' }}
                      onClick={() => handleRemove(exam.id)}>✓</button>
                    <button className="btn-icon" onClick={() => setConfirm(null)}>✕</button>
                  </div>
                ) : (
                  <button className="btn-icon" style={{ color: 'var(--danger)', flexShrink: 0 }}
                    onClick={() => setConfirm(exam.id)}>🗑️</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
