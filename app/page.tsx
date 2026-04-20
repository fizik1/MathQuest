'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LandingPage from '@/components/auth/LandingPage';

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setReady(true); return; }
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', session.user.id).single();
      router.replace(profile?.role === 'admin' ? '/admin' : '/student');
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
