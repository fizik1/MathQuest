'use client';
import { useState } from 'react';
import AuthModal from './AuthModal';

export default function LandingPage() {
  const [modal, setModal] = useState<'student' | 'admin' | null>(null);

  return (
    <div className="auth-page">
      <div className="landing-container fade-in">
        <div className="hero">
          <div className="hero-content">
            <span className="badge-landing">✨ 6-sinf matematikasi</span>
            <h1>Math<span className="accent-text">Quest</span></h1>
            <p>
              Matematika olamiga xush kelibsiz! Nazariyani o&apos;rganing, testlar ishlang,
              XP to&apos;plang va eng yaxshilar safiga qo&apos;shiling.
            </p>
            <div className="hero-actions">
              <button className="btn-hero btn-hero-primary" onClick={() => setModal('student')}>
                🎒 O&apos;quvchi bo&apos;lib kirish
              </button>
              <button className="btn-hero btn-hero-secondary" onClick={() => setModal('admin')}>
                👨‍🏫 O&apos;qituvchi paneli
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card">
              <div className="hc-icon">📚</div>
              <h3>6</h3>
              <p>ta asosiy mavzu</p>
            </div>
            <div className="hero-card" style={{ animation: 'float 5s ease-in-out infinite' }}>
              <div className="hc-icon">🏆</div>
              <h3>XP</h3>
              <p>tizimi</p>
            </div>
            <div className="hero-card" style={{ animation: 'float 5s ease-in-out infinite 1s' }}>
              <div className="hc-icon">🎬</div>
              <h3>📹</h3>
              <p>Video darslar</p>
            </div>
          </div>
        </div>
      </div>

      {modal && <AuthModal type={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
