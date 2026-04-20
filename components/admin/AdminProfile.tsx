'use client';
import { AppUser } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface Props { user: AppUser; topicsCount: number; }

export default function AdminProfile({ user, topicsCount }: Props) {
  async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div>
      <h1 className="view-title">Profil 👤</h1>

      <div className="card profile-header-card" style={{ marginBottom: '1.25rem' }}>
        <div className="large-avatar">👨‍🏫</div>
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <span className="pill" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            👨‍🏫 O&apos;qituvchi
          </span>
          <span className="pill" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            ✅ Admin
          </span>
        </div>
      </div>

      <div className="grid" style={{ marginBottom: '1.25rem' }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ color: 'var(--primary)' }}>📚</div>
          <div className="stat-info"><h3 style={{ color: 'var(--primary)' }}>{topicsCount}</h3><p>Jami mavzular</p></div>
        </div>
      </div>

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
