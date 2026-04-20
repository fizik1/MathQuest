'use client';
import { useState } from 'react';
import { Topic, Quiz } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

interface Props {
  topics: Topic[];
  saving: boolean;
  onAddQuestion: (topicId: string, quiz: Quiz) => Promise<void>;
  onRemoveQuestion: (topicId: string, index: number) => Promise<void>;
}

export default function QuizBuilder({ topics, saving, onAddQuestion, onRemoveQuestion }: Props) {
  const { toast }    = useToast();
  const [topicId,    setTopicId]    = useState(topics[0]?.id || '');
  const [type,       setType]       = useState<'mcq' | 'fib'>('mcq');
  const [question,   setQuestion]   = useState('');
  const [options,    setOptions]    = useState(['', '', '', '']);
  const [correct,    setCorrect]    = useState<number>(0);
  const [fibAnswer,  setFibAnswer]  = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [confirm,    setConfirm]    = useState<number | null>(null);

  function updateOption(i: number, val: string) {
    setOptions(prev => prev.map((o, idx) => idx === i ? val : o));
  }

  async function handleAdd() {
    if (!topicId || !question.trim()) { toast('Savol matnini kiriting!', 'warning'); return; }
    if (type === 'mcq' && options.some(o => !o.trim())) {
      toast('Barcha 4 ta variant to\'ldirilishi kerak!', 'warning'); return;
    }
    if (type === 'fib' && !fibAnswer.trim()) {
      toast('To\'g\'ri javobni kiriting!', 'warning'); return;
    }

    const quiz: Quiz = type === 'mcq'
      ? { type: 'mcq', q: question.trim(), options: options.map(o => o.trim()), correct, difficulty }
      : { type: 'fib', q: question.trim(), correct: fibAnswer.trim(), difficulty };

    await onAddQuestion(topicId, quiz);
    setQuestion(''); setOptions(['', '', '', '']); setCorrect(0); setFibAnswer('');
    toast('Savol qo\'shildi! 🧠');
  }

  async function handleRemove(idx: number) {
    await onRemoveQuestion(topicId, idx);
    setConfirm(null);
    toast('Savol o\'chirildi', 'info');
  }

  const selectedTopic = topics.find(t => t.id === topicId);

  return (
    <div>
      <h1 className="view-title">Test yaratish 🧠</h1>
      <p className="view-subtitle">MCQ yoki bo&apos;sh joy to&apos;ldirish savollarini qo&apos;shing.</p>

      {topics.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">🧠</div>
          <p>Avval mavzu qo&apos;shing, so&apos;ng savol yarating.</p>
        </div>
      ) : (
        <>
          {/* Add question form */}
          <div className="card admin-form-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>➕ Yangi savol qo&apos;shish</h3>

            <div className="form-grid">
              <div className="form-group">
                <label>Mavzu</label>
                <select className="form-input" value={topicId} onChange={e => setTopicId(e.target.value)}>
                  {topics.map(t => <option key={t.id} value={t.id}>{t.icon} {t.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Savol turi</label>
                <select className="form-input" value={type} onChange={e => setType(e.target.value as 'mcq' | 'fib')}>
                  <option value="mcq">Ko&apos;p tanlovli (MCQ)</option>
                  <option value="fib">Bo&apos;sh joy to&apos;ldirish (FIB)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Savol matni *</label>
              <textarea className="form-input" rows={3} placeholder="Savol matni..."
                value={question} onChange={e => setQuestion(e.target.value)}
                style={{ resize: 'vertical' }} />
            </div>

            {type === 'mcq' ? (
              <div>
                <div className="form-grid">
                  {options.map((opt, i) => (
                    <div key={i} className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                        <input type="radio" name="correct" checked={correct === i}
                          onChange={() => setCorrect(i)} />
                        <span>{String.fromCharCode(65 + i)}-variant</span>
                        {correct === i && <span className="pill pill-success" style={{ fontSize: '0.7rem' }}>✅ To&apos;g&apos;ri</span>}
                      </label>
                      <input type="text" className="form-input"
                        placeholder={`${String.fromCharCode(65 + i)}-variant`}
                        value={opt} onChange={e => updateOption(i, e.target.value)} />
                    </div>
                  ))}
                </div>
                <p className="text-muted" style={{ fontSize: '0.82rem' }}>
                  ☝️ To&apos;g&apos;ri javob oldidagi radio tugmasini tanlang.
                </p>
              </div>
            ) : (
              <div className="form-group">
                <label>To&apos;g&apos;ri javob *</label>
                <input type="text" className="form-input"
                  placeholder="To'g'ri javob..."
                  value={fibAnswer} onChange={e => setFibAnswer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !saving && handleAdd()} />
                <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.3rem' }}>
                  O&apos;quvchi javobi bosh harf farqisiz tekshiriladi.
                </p>
              </div>
            )}

            <div className="form-group">
              <label>Qiyinlik darajasi</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {([['easy', '🟢 Oson'], ['medium', '🟡 O\'rtacha'], ['hard', '🔴 Qiyin']] as const).map(([val, label]) => (
                  <button key={val}
                    onClick={() => setDifficulty(val)}
                    style={{
                      flex: 1, padding: '0.5rem', border: '1.5px solid',
                      borderColor: difficulty === val ? 'var(--primary)' : 'var(--border)',
                      background: difficulty === val ? 'var(--primary-light)' : 'transparent',
                      color: difficulty === val ? 'var(--primary)' : 'var(--text-muted)',
                      borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button className="primary-btn" onClick={handleAdd} disabled={saving || !question.trim()}>
              {saving
                ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saqlanmoqda...</>
                : '✅ Savol qo\'shish'}
            </button>
          </div>

          {/* Existing questions */}
          {selectedTopic && selectedTopic.quizzes?.length > 0 && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>
                {selectedTopic.icon} {selectedTopic.title} — {selectedTopic.quizzes.length} ta savol
              </h3>
              {selectedTopic.quizzes.map((q, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '0.8rem 0',
                  borderBottom: i < selectedTopic.quizzes.length - 1 ? '1px solid var(--border)' : 'none',
                  gap: '1rem',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{i + 1}. {q.q}</p>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span className="pill pill-primary" style={{ fontSize: '0.7rem' }}>
                        {q.type === 'mcq' ? 'MCQ' : 'FIB'}
                      </span>
                      <span className="pill pill-muted" style={{ fontSize: '0.7rem' }}>
                        {q.type === 'mcq'
                          ? `To'g'ri: ${(q.options as string[])?.[q.correct as number]}`
                          : `Javob: ${q.correct}`}
                      </span>
                      <span className={`pill ${q.difficulty === 'easy' ? 'pill-success' : q.difficulty === 'hard' ? '' : 'pill-primary'}`}
                        style={{ fontSize: '0.7rem', ...(q.difficulty === 'hard' ? { background: 'var(--danger-light)', color: 'var(--danger)' } : {}) }}>
                        {q.difficulty === 'easy' ? '🟢' : q.difficulty === 'hard' ? '🔴' : '🟡'} {q.difficulty}
                      </span>
                    </div>
                  </div>

                  {confirm === i ? (
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>O&apos;chirilsinmi?</span>
                      <button className="btn-icon" style={{ background: 'var(--danger)', color: 'white', borderColor: 'var(--danger)' }}
                        onClick={() => handleRemove(i)}>✓</button>
                      <button className="btn-icon" onClick={() => setConfirm(null)}>✕</button>
                    </div>
                  ) : (
                    <button className="btn-icon" style={{ color: 'var(--danger)', flexShrink: 0 }}
                      onClick={() => setConfirm(i)}>🗑️</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
