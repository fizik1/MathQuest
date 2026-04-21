'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/api';
import LandingPage from '@/components/auth/LandingPage';

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getSession().then(session => {
      if (!session) { setReady(true); return; }
      router.replace(session.role === 'admin' ? '/admin' : '/student');
    });
  }, [router]);

  if (!ready) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '1rem', minHeight: '100vh',
        background: 'var(--bg-main)',
      }}>
        <div className="spinner" style={{ width: 44, height: 44, borderWidth: 3 }} />
      </div>
    );
  }

  return <LandingPage />;
}
