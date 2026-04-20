'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Exam, Topic, Quiz } from '@/lib/types';
import { fisherYates } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface PreparedQuestion {
  original: Quiz;
  shuffledOptions: string[];
  correctIndex: number;
}

interface Props {
  exam: Exam;
  topics: Topic[];
  onComplete: (exam: Exam, score: number, total: number, timeTaken: number) => Promise<number>;
  onBack: () => void;
}

type Phase = 'quiz' | 'result';

function prepareQuestions(exam: Exam, topics: Topic[]): PreparedQuestion[] {
  // Gather pool of MCQ-only questions from source topic(s)
  const pool: Quiz[] = [];
  if (exam.topicId === 'all') {
    topics.forEach(t => (t.quizzes || []).forEach(q => { if (q.type === 'mcq') pool.push(q); }));
  } else {
    const t = topics.find(t => t.id === exam.topicId);
    (t?.quizzes || []).forEach(q => { if (q.type === 'mcq') pool.push(q); });
  }

  const selected = fisherYates(pool).slice(0, exam.questionCount);

  return selected.map(q => {
    const correctText  = (q.options as string[])[q.correct as number];
    const shuffled     = fisherYates([...(q.options as string[])]);
    const correctIndex = shuffled.indexOf(correctText);
    return { original: q, shuffledOptions: shuffled, correctIndex };
  });
}

export default function ExamSession({ exam, topics, onComplete, onBack }: Props) {
  const { toast } = useToast();

  const [phase,     setPhase]     = useState<Phase>('quiz');
  const [questions] = useState<PreparedQuestion[]>(() => prepareQuestions(exam, topics));
  const [current,   setCurrent]   = useState(0);
  const [answers,   setAnswers]   = useState<(number | null)[]>(() => Array(questions.length).fill(null));
  const [feedback,  setFeedback]  = useState<'correct' | 'wrong' | null>(null);
  const [score,     setScore]     = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(exam.timeLimitMinutes * 60);
  const [xpEarned,  setXpEarned]  = useState(0);
  const [saving,    setSaving]    = useState(false);
  const startTime = useRef(Date.now());
  const answersRef = useRef<(number | null)[]>(Array(questions.length).fill(null));

  // ── Timer ────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (finalAnswers: (number | null)[], finalScore: number) => {
    if (saving) return;
    const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
    setSaving(true);
    const xp = await onComplete(exam, finalScore, finalAnswers.length, timeTaken);
    setXpEarned(xp);
    if (xp > 0) toast(`+${xp} XP to'plandi! ⚡`);
    setPhase('result');
    setSaving(false);
  }, [exam, onComplete, saving, toast]);

  useEffect(() => {
    if (phase !== 'quiz') return;
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id);
          // Auto-submit with current answers
          const currentScore = answersRef.current.reduce<number>((acc, ans, i) =>
            acc + (ans !== null && ans === questions[i].correctIndex ? 1 : 0), 0);
          handleSubmit(answersRef.current, currentScore);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, questions, handleSubmit]);

  if (questions.length === 0) {
    return (
      <div className="card empty-state">
        <div className="empty-icon">😔</div>
        <p>Bu imtihon uchun yetarli savollar yo&apos;q.</p>
        <button className="secondary-btn" style={{ marginTop: '1rem' }} onClick={onBack}>← Orqaga</button>
      </div>
    );
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  const timePct = (timeLeft / (exam.timeLimitMinutes * 60)) * 100;
  const timeUrgent = timeLeft <= 60;

  // ── Result screen ─────────────────────────────────────────────
  if (phase === 'result') {
    const pct    = Math.round((score / questions.length) * 100);
    const passed = pct >= exam.passingScore;
    return (
      <div className="fade-in">
        <div className="card exam-result-card">
          <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>{passed ? '🎉' : '💪'}</div>
          <div className={`result-percent ${passed ? 'result-passed' : 'result-failed'}`}>{pct}%</div>
          <p className="text-muted" style={{ marginTop: '0.5rem', marginBottom: '1.75rem' }}>
            {passed
              ? 'Ajoyib! Imtihondan o\'tdingiz!'
              : `Qayta urining — ${exam.passingScore}% kerak.`}
          </p>

          <div className="grid-2" style={{ marginBottom: '1.75rem', gap: '1rem' }}>
            <div className="card stat-card" style={{ padding: '1rem' }}>
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{score}/{questions.length}</h3>
                <p>To&apos;g&apos;ri javob</p>
              </div>
            </div>
            <div className="card stat-card" style={{ padding: '1rem' }}>
              <div className="stat-icon">⚡</div>
              <div className="stat-info">
                <h3 style={{ color: xpEarned > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {xpEarned > 0 ? `+${xpEarned}` : '—'}
                </h3>
                <p>XP qozondingiz</p>
              </div>
            </div>
          </div>

          {passed && (
            <p className="text-success" style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>
              ✅ Keyingi imtihon ochildi!
            </p>
          )}

          <button className="primary-btn" onClick={onBack}>← Imtihonlar ro&apos;yxatiga</button>
        </div>
      </div>
    );
  }

  // ── Quiz screen ───────────────────────────────────────────────
  const q   = questions[current];
  const pct = Math.round((current / questions.length) * 100);

  function handleAnswer(optIndex: number) {
    if (feedback) return;
    const isCorrect = optIndex === q.correctIndex;
    if (isCorrect) setScore(s => s + 1);

    const newAnswers = [...answersRef.current];
    newAnswers[current] = optIndex;
    answersRef.current  = newAnswers;
    setAnswers(newAnswers);

    setFeedback(isCorrect ? 'correct' : 'wrong');

    setTimeout(() => {
      setFeedback(null);
      if (current + 1 >= questions.length) {
        const finalScore = newAnswers.reduce<number>((acc, ans, i) =>
          acc + (ans !== null && ans === questions[i].correctIndex ? 1 : 0), 0);
        handleSubmit(newAnswers, finalScore);
      } else {
        setCurrent(c => c + 1);
      }
    }, 900);
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="quiz-header">
        <h2 style={{ fontSize: '1rem' }}>📝 {exam.title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="quiz-counter">{current + 1} / {questions.length}</span>
          <span className={`exam-timer ${timeUrgent ? 'exam-timer-urgent' : ''}`}>
            ⏱️ {timeStr}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="quiz-progress-bar" style={{ marginBottom: '0.5rem' }}>
        <div className="fill" style={{ width: `${pct}%` }} />
      </div>

      {/* Timer bar */}
      <div className="exam-time-bar" style={{ marginBottom: '1rem' }}>
        <div className={`fill ${timeUrgent ? 'urgent' : ''}`}
          style={{ width: `${timePct}%`, transition: 'width 1s linear' }} />
      </div>

      {/* Question */}
      <div className="card quiz-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '0.5rem' }}>
          <p className="question-text" style={{ margin: 0 }}>{q.original.q}</p>
          <span className={`pill pill-${q.original.difficulty === 'easy' ? 'success' : q.original.difficulty === 'hard' ? 'muted' : 'primary'}`}
            style={{ flexShrink: 0, fontSize: '0.7rem' }}>
            {q.original.difficulty === 'easy' ? '🟢 Oson' : q.original.difficulty === 'hard' ? '🔴 Qiyin' : '🟡 O\'rtacha'}
          </span>
        </div>

        <div className="quiz-options">
          {q.shuffledOptions.map((opt, i) => {
            let cls = 'option-btn';
            if (feedback && i === q.correctIndex)                   cls += ' correct';
            if (feedback && answers[current] === i && i !== q.correctIndex) cls += ' wrong';
            return (
              <button key={i} className={cls} onClick={() => handleAnswer(i)} disabled={!!feedback}>
                <span style={{ opacity: 0.5, marginRight: '0.5rem', fontWeight: 700 }}>
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <button className="back-btn" style={{ marginTop: '1rem' }} onClick={onBack}>
        ← Imtihonlar ro&apos;yxatiga
      </button>
    </div>
  );
}
