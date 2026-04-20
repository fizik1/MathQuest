'use client';
import { AppUser, Topic } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface Props {
  user: AppUser;
  xp: number;
  level: number;
  streak: number;
  topics: Topic[];
  progress: { [topicId: string]: number };
}

const BADGES = [
  { cond: (xp: number, level: number, done: number) => xp > 0,        emoji: '🎯', label: 'Birinchi qadam' },
  { cond: (xp: number, level: number, done: number) => level > 1,     emoji: '🌟', label: 'Bilimdon' },
  { cond: (xp: number, level: number, done: number) => done >= 3,     emoji: '🎓', label: 'Matematik' },
  { cond: (xp: number, level: number, done: number) => xp >= 500,     emoji: '🏅', label: 'XP Chempioni' },
  { cond: (xp: number, level: number, done: number) => xp >= 1000,    emoji: '🏆', label: 'Grandmaster' },
];

export default function StudentProfile({ user, xp, level, streak, topics, progress }: Props) {
  const completed = topics.filter(t => (progress[t.id] || 0) >= 70).length;
  const xpInLevel = xp % 100;
  const earned    = BADGES.filter(b => b.cond(xp, level, completed));

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div>
      <h1 className="view-title">Profil 👤</h1>

      {/* Profile header */}
      <div className="card profile-header-card" style={{ marginBottom: '1.25rem' }}>
        <div className="large-avatar">👤</div>
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <span className="pill" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            🎒 O&apos;quvchi
          </span>
          <span className="pill" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            🌟 {level}-daraja
          </span>
        </div>
      </div>

      {/* XP Progress */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>⚡ XP Progress</span>
          <span className="text-muted" style={{ fontSize: '0.82rem' }}>{xp} / {level * 100} XP</span>
        </div>
        <div className="xp-progress-bar" style={{ height: 10 }}>
          <div className="fill" style={{ width: `${xpInLevel}%` }} />
        </div>
        <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
          Keyingi darajaga {100 - xpInLevel} XP qoldi
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid" style={{ marginBottom: '1.25rem' }}>
        {[
          { icon: '⚡', value: xp,        label: 'Jami XP',       color: 'var(--primary)' },
          { icon: '🌟', value: level,     label: 'Daraja',        color: 'var(--secondary)' },
          { icon: '✅', value: completed, label: 'Yakunlangan',   color: 'var(--success)' },
          { icon: '🔥', value: streak,    label: 'Streak (kun)',  color: 'var(--danger)' },
        ].map(s => (
          <div key={s.label} className="card stat-card" style={{ padding: '1.25rem' }}>
            <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
            <div className="stat-info">
              <h3 style={{ color: s.color }}>{s.value}</h3>
              <p>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Badges */}
      {earned.length > 0 && (
        <div className="card" style={{ marginBottom: '1.25rem', padding: '1.5rem' }}>
          <div className="section-title">🏆 Medallar</div>
          <div className="badges-container">
            {earned.map(b => (
              <span key={b.label} className="badge">
                {b.emoji} {b.label}
              </span>
            ))}
          </div>
          {earned.length < BADGES.length && (
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.75rem' }}>
              Yana {BADGES.length - earned.length} ta medal qolyapti!
            </p>
          )}
        </div>
      )}

      {/* Logout */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
          Hisobdan chiqish uchun quyidagi tugmani bosing.
        </p>
        <button className="danger-btn" onClick={logout}>
          🚪 Chiqish
        </button>
      </div>
    </div>
  );
}
