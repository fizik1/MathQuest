'use client';
import { Topic } from '@/lib/types';

interface Props {
  xp: number;
  level: number;
  streak: number;
  topics: Topic[];
  progress: { [topicId: string]: number };
  onNavigate: (page: string) => void;
}

export default function StudentDashboard({ xp, level, streak, topics, progress, onNavigate }: Props) {
  const xpInLevel  = xp % 100;
  const nextXp     = 100 - xpInLevel;
  const completed  = topics.filter(t => (progress[t.id] || 0) >= 70).length;
  const firstTopic = topics[0];

  const shortcuts = [
    { icon: '📚', title: 'Mavzular',  desc: 'Nazariya va test',  page: 'topics',      bg: 'rgba(99,102,241,0.08)' },
    { icon: '🎬', title: 'Videolar',  desc: 'XP qozon',          page: 'videos',      bg: 'rgba(245,158,11,0.08)' },
    { icon: '🏆', title: 'Reyting',   desc: 'Top o\'quvchilar',  page: 'leaderboard', bg: 'rgba(16,185,129,0.08)' },
    { icon: '👤', title: 'Profil',    desc: 'Medalli yutuqlar',  page: 'profile',     bg: 'rgba(239,68,68,0.08)' },
  ];

  return (
    <div>
      {/* Hero card */}
      <div className="daily-challenge card" style={{ marginBottom: '1.5rem' }}>
        <h3>🎯 Kunlik mashq</h3>
        <p>
          {firstTopic
            ? `"${firstTopic.title}" mavzusidan bugun test ishlang!`
            : 'Mavzular yuklanmoqda...'}
        </p>
        <button className="primary-btn" onClick={() => onNavigate('topics')}>
          Boshlash 🚀
        </button>
      </div>

      {/* Stats row */}
      <div className="grid" style={{ marginBottom: '1.5rem' }}>
        {/* Level & XP */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📈 Progress
          </div>
          <div className="level-indicator" style={{ marginBottom: '0.75rem' }}>
            <div className="level-ring">{level}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                <span>⚡ {xp} XP</span>
                <span className="text-muted">+{nextXp} XP</span>
              </div>
              <div className="xp-progress-bar">
                <div className="fill" style={{ width: `${xpInLevel}%` }} />
              </div>
            </div>
          </div>
          <p className="text-muted" style={{ fontSize: '0.82rem' }}>
            ✅ {completed} / {topics.length} mavzu yakunlangan
          </p>
        </div>

        {/* Streak */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: 60, height: 60,
            background: 'rgba(239,68,68,0.1)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', flexShrink: 0,
          }}>
            🔥
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{streak}</div>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>kun ketma-ket</p>
          </div>
        </div>

        {/* Topics done */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: 60, height: 60,
            background: 'rgba(16,185,129,0.1)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', flexShrink: 0,
          }}>
            📚
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{completed}</div>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>mavzu tugallangan</p>
          </div>
        </div>
      </div>

      {/* Shortcuts */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-sub)' }}>Tezkor havola</h2>
      <div className="grid">
        {shortcuts.map(s => (
          <div
            key={s.page}
            className="card access-card card-hover"
            style={{ background: s.bg, border: 'none', cursor: 'pointer' }}
            onClick={() => onNavigate(s.page)}
          >
            <div className="icon">{s.icon}</div>
            <h4>{s.title}</h4>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
