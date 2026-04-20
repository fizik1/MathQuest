'use client';
import { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  msg: string;
  type: ToastType;
}

interface ToastCtx {
  toast: (msg: string, type?: ToastType) => void;
}

const Ctx = createContext<ToastCtx>({ toast: () => {} });

export function useToast() {
  return useContext(Ctx);
}

const ICONS: Record<ToastType, string> = {
  success: '✅',
  error:   '❌',
  info:    'ℹ️',
  warning: '⚠️',
};

const COLORS: Record<ToastType, string> = {
  success: 'var(--success)',
  error:   'var(--danger)',
  info:    'var(--primary)',
  warning: 'var(--secondary)',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((msg: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed', top: '1.25rem', right: '1.25rem',
        zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.6rem',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: COLORS[t.type],
            color: 'white',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-full)',
            fontWeight: 600,
            fontSize: '0.88rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            maxWidth: '320px',
          }}>
            <span>{ICONS[t.type]}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
