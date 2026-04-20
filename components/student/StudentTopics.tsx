'use client';
import { useState } from 'react';
import { Topic, Materials } from '@/lib/types';
import TopicDetail from './TopicDetail';
import QuizView    from './QuizView';

interface Props {
  topics: Topic[];
  materials: Materials;
  unlockedTopics: string[];
  progress: { [topicId: string]: number };
  topicXP: { [topicId: string]: number };
  watchedVideos: { [key: string]: boolean };
  onQuizComplete: (topicId: string, score: number, total: number) => Promise<number>;
  onWatchVideo: (topicId: string, videoIndex: number) => Promise<number>;
}

type View = 'list' | 'detail' | 'quiz';

export default function StudentTopics({
  topics, materials, unlockedTopics, progress, topicXP, watchedVideos,
  onQuizComplete, onWatchVideo,
}: Props) {
  const [view,    setView]    = useState<View>('list');
  const [topicId, setTopicId] = useState('');

  const topic = topics.find(t => t.id === topicId) || null;

  function openTopic(id: string) {
    setTopicId(id);
    setView('detail');
    window.scrollTo(0, 0);
  }

  // ── Quiz view ────────────────────────────────────────────────
  if (view === 'quiz' && topic) {
    return (
      <QuizView
        topic={topic}
        prevTopicXP={topicXP[topicId] || 0}
        onComplete={async (score, total) => {
          const xpAdded = await onQuizComplete(topicId, score, total);
          return xpAdded;
        }}
        onBack={() => setView('detail')}
      />
    );
  }

  // ── Topic detail view ────────────────────────────────────────
  if (view === 'detail' && topic) {
    return (
      <TopicDetail
        topic={topic}
        topicIndex={topics.findIndex(t => t.id === topicId)}
        materials={materials[topicId] || []}
        progress={progress[topicId] || 0}
        watchedVideos={watchedVideos}
        onWatchVideo={vi => onWatchVideo(topicId, vi)}
        onStartQuiz={() => setView('quiz')}
        onBack={() => setView('list')}
      />
    );
  }

  // ── Topic list ───────────────────────────────────────────────
  return (
    <div>
      <h1 className="view-title">Mavzular 📚</h1>
      <p className="view-subtitle">Mavzuni tanlang, nazariyani o&apos;rganing va testni ishlang.</p>

      {topics.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">📚</div>
          <p>Hozircha mavzular qo&apos;shilmagan. O&apos;qituvchingizni kuting.</p>
        </div>
      ) : (
        <div className="topics-grid">
          {topics.map((t, idx) => {
            const unlocked = unlockedTopics.includes(t.id);
            const pct      = progress[t.id] || 0;
            const passed   = pct >= 70;
            const mats     = materials[t.id] || [];
            const videos   = t.videos?.length || 0;

            return (
              <div key={t.id} className={`card topic-card ${!unlocked ? 'locked' : ''}`}
                style={{ cursor: unlocked ? 'default' : 'not-allowed' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div className="topic-icon">{unlocked ? t.icon : '🔒'}</div>
                  {passed && <span className="pill pill-success">✅ O&apos;tildi</span>}
                </div>

                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.05rem' }}>{t.title}</h3>

                {/* Meta */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {t.quizzes?.length > 0 && (
                    <span className="pill pill-primary">❓ {t.quizzes.length} savol</span>
                  )}
                  {videos > 0 && (
                    <span className="pill" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--secondary)' }}>
                      🎬 {videos} video
                    </span>
                  )}
                  {mats.length > 0 && (
                    <span className="pill pill-muted">📁 {mats.length} material</span>
                  )}
                </div>

                {/* Progress */}
                {unlocked && pct > 0 && (
                  <div className="progress-info">
                    <div className="progress-bar"><div className="fill" style={{ width: `${pct}%` }} /></div>
                    <span>{pct}%</span>
                  </div>
                )}

                {/* Actions */}
                {unlocked ? (
                  <button
                    className="primary-btn w-full"
                    style={{ marginTop: '1rem' }}
                    onClick={() => openTopic(t.id)}
                  >
                    {pct > 0 ? 'Davom ettirish →' : 'Boshlash →'}
                  </button>
                ) : (
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.75rem' }}>
                    {idx === 0 ? '🔒 Qulflangan' : '🔒 Oldingi mavzuda 70% ball to\'plang'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
