'use client';
import { useState } from 'react';
import { Topic } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

interface Props {
  topic: Topic;
  prevTopicXP: number;
  onComplete: (score: number, total: number) => Promise<number>;
  onBack: () => void;
}

type Phase = 'question' | 'result';

export default function QuizView({ topic, prevTopicXP, onComplete, onBack }: Props) {
  const { toast }  = useToast();
  const quizzes    = topic.quizzes || [];
  const [phase,    setPhase]    = useState<Phase>('question');
  const [current,  setCurrent]  = useState(0);
  const [score,    setScore]    = useState(0);
  const [fibInput, setFibInput] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [xpAdded,  setXpAdded]  = useState(0);
  const [saving,   setSaving]   = useState(false);

  if (quizzes.length === 0) {
    return (
      <div className="card empty-state">
        <div className="empty-icon">🧠</div>
        <p>Hali test qo&apos;shilmagan.</p>
        <button className="secondary-btn" style={{ marginTop: '1rem' }} onClick={onBack}>← Orqaga</button>
      </div>
    );
  }

  const q   = quizzes[current];
  const pct = Math.round((current / quizzes.length) * 100);

  function checkAnswer(answer: string | number) {
    if (feedback) return;
    const isCorrect = q.type === 'mcq'
      ? answer === q.correct
      : String(answer).trim().toLowerCase() === String(q.correct).trim().toLowerCase();

    if (isCorrect) setScore(s => s + 1);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (q.type === 'mcq') setSelected(answer as number);

    setTimeout(() => {
      setFeedback(null);
      setSelected(null);
      setFibInput('');
      if (current + 1 >= quizzes.length) {
        setPhase('result');
      } else {
        setCurrent(c => c + 1);
      }
    }, 800);
  }

  // ── Result ───────────────────────────────────────────────────
  if (phase === 'result') {
    const finalPct = Math.round((score / quizzes.length) * 100);
    const passed   = finalPct >= 70;
    const earned   = score * 10;
    const toAdd    = Math.max(0, earned - prevTopicXP);

    const handleFinish = async () => {
      setSaving(true);
      const xp = await onComplete(score, quizzes.length);
      setXpAdded(xp);
      if (xp > 0) toast(`+${xp} XP to'plandi! ⚡`);
      else toast('Oldingi natijangizdan yuqori emas', 'info');
    };

    return (
      <div className="fade-in">
        <div className="card quiz-result">
          <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>
            {passed ? '🎉' : '💪'}
          </div>
          <div className={`result-percent ${passed ? 'result-passed' : 'result-failed'}`}>
            {finalPct}%
          </div>
          <p className="text-muted" style={{ marginTop: '0.5rem', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
            {passed
              ? 'Ajoyib! Mavzuni muvaffaqiyatli topshirdingiz.'
              : "Qayta urining — 70% olsangiz keyingi mavzu ochildi!"}
          </p>

          <div className="grid-2" style={{ marginBottom: '1.75rem', gap: '1rem' }}>
            <div className="card stat-card" style={{ padding: '1rem' }}>
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{score}/{quizzes.length}</h3>
                <p>To&apos;g&apos;ri javob</p>
              </div>
            </div>
            <div className="card stat-card" style={{ padding: '1rem' }}>
              <div className="stat-icon">⚡</div>
              <div className="stat-info">
                <h3 style={{ color: toAdd > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {toAdd > 0 ? `+${toAdd}` : '—'}
                </h3>
                <p>XP qozondingiz</p>
              </div>
            </div>
          </div>

          {toAdd === 0 && earned > 0 && (
            <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>
              ℹ️ Bu mavzudan allaqachon maksimal XP oldingan
            </p>
          )}

          {passed && (
            <p className="text-success" style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>
              ✅ Keyingi mavzu ochildi!
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!saving ? (
              <>
                {finalPct < 70 && (
                  <button className="primary-btn" onClick={() => {
                    setCurrent(0); setScore(0); setPhase('question');
                  }}>
                    🔄 Qayta urinish
                  </button>
                )}
                <button className="primary-btn" onClick={handleFinish} disabled={saving}>
                  {passed ? '➡️ Davom etish' : '← Mavzuga qaytish'}
                </button>
              </>
            ) : (
              <div className="spinner" />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Question ─────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <div className="quiz-header">
        <h2 style={{ fontSize: '1rem' }}>{topic.icon} {topic.title}</h2>
        <span className="quiz-counter">{current + 1} / {quizzes.length}</span>
      </div>

      <div className="quiz-progress-bar">
        <div className="fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="card quiz-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '0.5rem' }}>
          <p className="question-text" style={{ margin: 0 }}>{q.q}</p>
          <span className={`pill pill-${q.difficulty === 'easy' ? 'success' : q.difficulty === 'hard' ? 'muted' : 'primary'}`} style={{ flexShrink: 0, fontSize: '0.7rem' }}>
            {q.difficulty === 'easy' ? '🟢 Oson' : q.difficulty === 'hard' ? '🔴 Qiyin' : '🟡 O\'rtacha'}
          </span>
        </div>

        {q.type === 'mcq' ? (
          <div className="quiz-options">
            {(q.options as string[]).map((opt, i) => {
              let cls = 'option-btn';
              if (feedback && i === q.correct)  cls += ' correct';
              if (feedback && selected === i && i !== q.correct) cls += ' wrong';
              return (
                <button key={i} className={cls}
                  onClick={() => checkAnswer(i)}
                  disabled={!!feedback}>
                  <span style={{ opacity: 0.5, marginRight: '0.5rem', fontWeight: 700 }}>
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ marginTop: '0.5rem' }}>
            <input
              type="text"
              className="fib-input"
              placeholder="Javobingizni yozing..."
              value={fibInput}
              onChange={e => setFibInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !feedback && fibInput.trim() && checkAnswer(fibInput)}
              disabled={!!feedback}
              autoFocus
            />
            <button
              className="primary-btn w-full"
              style={{ marginTop: '0.75rem' }}
              onClick={() => checkAnswer(fibInput)}
              disabled={!!feedback || !fibInput.trim()}>
              ✅ Tasdiqlash
            </button>
          </div>
        )}
      </div>

      <button className="back-btn" style={{ marginTop: '1rem' }} onClick={onBack}>
        ← Nazariyaga qaytish
      </button>
    </div>
  );
}
