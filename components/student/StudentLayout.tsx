'use client';
import { useState, useEffect } from 'react';
import { logout } from '@/lib/api';
import { AppUser } from '@/lib/types';
import { ToastProvider } from '@/components/ui/Toast';

interface Props {
  user: AppUser;
  currentPage: string;
  xp: number;
  level: number;
  streak: number;
  saving: boolean;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}

const NAV = [
  { id: 'dashboard',   icon: '🏠', label: 'Bosh sahifa' },
  { id: 'topics',      icon: '📚', label: 'Mavzular' },
  { id: 'videos',      icon: '🎬', label: 'Videolar' },
  { id: 'imtihonlar',  icon: '📝', label: 'Imtihonlar' },
  { id: 'leaderboard', icon: '🏆', label: 'Reyting' },
  { id: 'profile',     icon: '👤', label: 'Profil' },
];

export default function StudentLayout({ user, currentPage, xp, level, streak, saving, onNavigate, children }: Props) {
  const [dark,        setDark]        = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mq_theme');
    if (saved === 'dark') { setDark(true); document.body.classList.add('dark-theme'); }
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.body.classList.toggle('dark-theme', next);
    localStorage.setItem('mq_theme', next ? 'dark' : '');
  }

  async function handleLogout() {
    await logout();
    window.location.href = '/';
  }

  function navigate(id: string) {
    onNavigate(id);
    setSidebarOpen(false);
  }

  return (
    <ToastProvider>
      <div className="app-shell">
        <div className={`save-indicator ${saving ? '' : 'hidden'}`}>
          <div className="spinner" />
          <span>Saqlanmoqda...</span>
        </div>

        <aside className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
          <div className="logo">
            <span className="logo-icon">🔢</span>
            <span className="logo-text">MathQuest</span>
          </div>

          <ul className="nav-links">
            {NAV.map(item => (
              <li key={item.id}
                className={currentPage === item.id ? 'active' : ''}
                onClick={() => navigate(item.id)}>
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>

          <div className="nav-divider" />
          <div className="theme-toggle" onClick={toggleTheme} title="Mavzuni o'zgartirish">
            {dark ? '☀️' : '🌙'}
          </div>
        </aside>

        <main className="content">
          <div className="top-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button className="mobile-menu-btn" onClick={() => setSidebarOpen(p => !p)}>☰</button>
              <div className="user-stats-bar">
                <span className="stat-badge xp-badge">⚡ {xp} XP</span>
                <span className="stat-badge level-badge">🌟 {level}-daraja</span>
                <span className="stat-badge streak-badge">🔥 {streak} kun</span>
              </div>
            </div>
            <div className="user-profile-summary">
              <span>{user.name}</span>
              <div className="header-avatar">👤</div>
              <button className="btn-icon" onClick={handleLogout} title="Chiqish" style={{ fontSize: '1rem' }}>🚪</button>
            </div>
          </div>

          <div className="fade-in">{children}</div>
        </main>

        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }} />
        )}
      </div>
    </ToastProvider>
  );
}
