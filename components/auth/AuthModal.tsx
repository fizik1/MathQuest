'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, register, logout } from '@/lib/api';

interface Props {
  type: 'student' | 'admin';
  onClose: () => void;
}

export default function AuthModal({ type, onClose }: Props) {
  const router  = useRouter();
  const isAdmin = type === 'admin';
  const [tab,      setTab]      = useState<'login' | 'register'>('login');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit() {
    if (!email || !password) { setError("Barcha majburiy maydonlarni to'ldiring!"); return; }
    if (tab === 'register' && !name.trim()) { setError("Ismingizni kiriting!"); return; }
    setLoading(true); setError('');

    try {
      let user;
      if (tab === 'register') {
        user = await register(email, password, name.trim());
      } else {
        user = await login(email, password);
      }

      if (isAdmin && user.role !== 'admin') {
        await logout();
        throw new Error("Bu hisob admin emas! O'qituvchi hisob bilan kiring.");
      }

      router.replace(user.role === 'admin' ? '/admin' : '/student');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Noma'lum xatolik";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box fade-in">
        <button className="close-btn" onClick={onClose}>×</button>

        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.35rem' }}>
            {isAdmin ? '👨‍🏫 O\'qituvchi kirishi' : '🎒 O\'quvchi kirishi'}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {isAdmin ? 'Faqat tasdiqlangan o\'qituvchilar kirishi mumkin'
                     : tab === 'login' ? 'Hisob orqali kirish' : 'Yangi hisob yaratish'}
          </p>
        </div>

        {!isAdmin && (
          <div className="auth-tabs">
            <button className={`tab-btn ${tab === 'login' ? 'active' : ''}`}
              onClick={() => { setTab('login'); setError(''); }}>
              Kirish
            </button>
            <button className={`tab-btn ${tab === 'register' ? 'active' : ''}`}
              onClick={() => { setTab('register'); setError(''); }}>
              Ro&apos;yxatdan o&apos;tish
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tab === 'register' && (
            <input type="text" placeholder="Ismingiz" className="form-input"
              value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
          )}
          <input type="email" placeholder="Email manzil" className="form-input"
            value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} autoComplete="email" />
          <input type="password" placeholder="Parol" className="form-input"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoComplete={tab === 'register' ? 'new-password' : 'current-password'} />

          {error && (
            <div style={{
              padding: '0.65rem 1rem', background: 'var(--danger-light)',
              color: 'var(--danger)', borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem', fontWeight: 600,
            }}>
              ⚠️ {error}
            </div>
          )}

          <button className="primary-btn w-full"
            style={{ marginTop: '0.25rem', padding: '0.8rem' }}
            onClick={handleSubmit} disabled={loading}>
            {loading
              ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Yuklanmoqda...</>
              : tab === 'register' ? "✅ Ro'yxatdan o'tish" : '🚀 Kirish'}
          </button>
        </div>
      </div>
    </div>
  );
}
