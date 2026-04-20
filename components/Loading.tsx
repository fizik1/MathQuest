'use client';

interface Props { visible: boolean; }

export default function Loading({ visible }: Props) {
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed', top: '1.25rem', right: '1.25rem',
      background: 'var(--bg-card)',
      padding: '0.6rem 1.25rem',
      borderRadius: 'var(--radius-full)',
      display: 'flex', alignItems: 'center', gap: '0.6rem',
      boxShadow: 'var(--shadow-lg)',
      border: '1px solid var(--border)',
      fontSize: '0.82rem', fontWeight: 600,
      color: 'var(--text-muted)',
      zIndex: 1000,
    }}>
      <div className="spinner" />
      <span>Saqlanmoqda...</span>
    </div>
  );
}
