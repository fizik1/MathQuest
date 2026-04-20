'use client';
import { Topic, Materials } from '@/lib/types';

interface Props {
  topics: Topic[];
  materials: Materials;
  onNavigate: (page: string) => void;
}

export default function AdminDashboard({ topics, materials, onNavigate }: Props) {
  const totalQuizzes   = topics.reduce((a, t) => a + (t.quizzes?.length || 0), 0);
  const totalVideos    = topics.reduce((a, t) => a + (t.videos?.length || 0), 0);
  const totalMaterials = Object.values(materials).reduce((a, c) => a + c.length, 0);

  const stats = [
    { icon: '📚', value: topics.length,   label: 'Mavzular',   color: 'var(--primary)',   bg: 'var(--primary-light)' },
    { icon: '❓', value: totalQuizzes,    label: 'Savollar',   color: 'var(--secondary)', bg: 'rgba(245,158,11,0.1)' },
    { icon: '🎬', value: totalVideos,     label: 'Videolar',   color: 'var(--success)',   bg: 'var(--success-light)' },
    { icon: '📁', value: totalMaterials,  label: 'Materiallar',color: 'var(--danger)',    bg: 'var(--danger-light)' },
  ];

  const actions = [
    { icon: '➕', title: 'Yangi mavzu',     desc: 'Mavzu qo\'shing',           page: 'topics',        color: 'var(--primary)' },
    { icon: '🎬', title: 'Video qo\'shish', desc: 'YouTube video biriktiring', page: 'videos',        color: 'var(--secondary)' },
    // { icon: '🧠', title: 'Test yaratish',   desc: 'MCQ yoki FIB savol',        page: 'mustahkamlash', color: 'var(--success)' },
    { icon: '🏆', title: 'Reyting',         desc: 'O\'quvchilar natijasi',      page: 'leaderboard',   color: 'var(--danger)' },
  ];

  return (
    <div>
      <h1 className="view-title">Boshqaruv paneli 🏠</h1>
      <p className="view-subtitle">Mavzularni boshqaring, test va materiallar qo&apos;shing.</p>

      {/* Stats */}
      <div className="grid" style={{ marginBottom: '2rem' }}>
        {stats.map(s => (
          <div key={s.label} className="card stat-card" style={{ background: s.bg, border: 'none' }}>
            <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
            <div className="stat-info">
              <h3 style={{ color: s.color, fontSize: '1.75rem' }}>{s.value}</h3>
              <p>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-sub)' }}>
        Tezkor havolalar
      </h2>
      <div className="grid">
        {actions.map(item => (
          <div key={item.page}
            className="card access-card card-hover"
            onClick={() => onNavigate(item.page)}
            style={{ borderLeft: `3px solid ${item.color}` }}>
            <div className="icon" style={{ color: item.color }}>{item.icon}</div>
            <h4>{item.title}</h4>
            <p>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Tips */}
      {topics.length === 0 && (
        <div className="card" style={{ marginTop: '1.5rem', background: 'var(--primary-light)', border: '1px solid rgba(var(--primary-rgb),0.2)', padding: '1.25rem' }}>
          <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>🚀 Boshlash uchun:</p>
          <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-sub)', fontSize: '0.9rem', lineHeight: 1.8 }}>
            <li><strong>Mavzular</strong> bo&apos;limiga o&apos;ting va birinchi mavzu qo&apos;shing</li>
            <li>Mavzuni tahrirlang: nazariya va materiallar qo&apos;shing</li>
            <li><strong>Videolar</strong>: YouTube havolalarini biriktiring</li>
            <li><strong>Test yaratish</strong>: savollar qo&apos;shing</li>
          </ol>
        </div>
      )}
    </div>
  );
}
