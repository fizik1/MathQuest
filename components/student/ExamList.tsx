'use client';
import { Exam } from '@/lib/types';

interface Props {
  exams: Exam[];
  examBestScores: { [examId: string]: number };
  unlockedExams: string[];
  onStart: (exam: Exam) => void;
}

export default function ExamList({ exams, examBestScores, unlockedExams, onStart }: Props) {
  if (exams.length === 0) {
    return (
      <div>
        <h1 className="view-title">Imtihonlar 📝</h1>
        <div className="card empty-state">
          <div className="empty-icon">📝</div>
          <p>Hali imtihon qo&apos;shilmagan.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="view-title">Imtihonlar 📝</h1>
      <p className="view-subtitle">
        Har bir imtihondan o&apos;tish uchun belgilangan baldan yuqori to&apos;plang.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {exams.map((exam, idx) => {
          const unlocked   = idx === 0 || unlockedExams.includes(exam.id);
          const bestScore  = examBestScores[exam.id];
          const hasBest    = bestScore !== undefined;
          const passed     = hasBest && bestScore >= exam.passingScore;
          const bestLabel  = hasBest ? `${bestScore}%` : null;

          return (
            <div key={exam.id}
              className={`card exam-card ${!unlocked ? 'exam-locked' : ''} ${passed ? 'exam-passed' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{unlocked ? (passed ? '✅' : '📝') : '🔒'}</span>
                    <div>
                      <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0' }}>
                        {idx + 1}. {exam.title}
                      </h3>
                      {exam.description && (
                        <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.15rem' }}>
                          {exam.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                    <span className="pill pill-muted" style={{ fontSize: '0.7rem' }}>❓ {exam.questionCount} savol</span>
                    <span className="pill pill-muted" style={{ fontSize: '0.7rem' }}>⏱️ {exam.timeLimitMinutes} daqiqa</span>
                    <span className="pill pill-primary" style={{ fontSize: '0.7rem' }}>🎯 {exam.passingScore}% o&apos;tish</span>
                    {hasBest && (
                      <span className={`pill ${passed ? 'pill-success' : ''}`}
                        style={{ fontSize: '0.7rem', ...(!passed ? { background: 'var(--danger-light)', color: 'var(--danger)' } : {}) }}>
                        🏆 Eng yaxshi: {bestLabel}
                      </span>
                    )}
                  </div>

                  {!unlocked && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      🔒 Avvalgi imtihondan o&apos;ting
                    </p>
                  )}
                </div>

                {unlocked && (
                  <button
                    className="primary-btn"
                    style={{ flexShrink: 0 }}
                    onClick={() => onStart(exam)}>
                    {hasBest ? '🔄 Qayta topshirish' : '▶ Boshlash'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
