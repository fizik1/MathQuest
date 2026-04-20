'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Row { student_id: string; name: string; xp: number; level: number; }

export default function AdminLeaderboard() {
  const [rows,    setRows]    = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    supabase.from('student_progress')
      .select('student_id, name, xp, level')
      .order('xp', { ascending: false })
      .limit(50)
      .then(({ data }) => { setRows(data || []); setLoading(false); });
  }

  useEffect(() => { reload(); }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="view-title">Reyting 🏆</h1>
          <p className="view-subtitle">Barcha o&apos;quvchilar natijasi.</p>
        </div>
        <button className="secondary-btn btn-sm" onClick={reload}>🔄 Yangilash</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : rows.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <p>Hali o&apos;quvchi yo&apos;q.</p>
          </div>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>O&apos;quvchi</th>
                <th>XP</th>
                <th>Daraja</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.student_id}>
                  <td style={{ fontWeight: 700, fontSize: i < 3 ? '1.1rem' : '0.9rem' }}>
                    {medals[i] || i + 1}
                  </td>
                  <td style={{ fontWeight: 600 }}>{row.name || 'O\'quvchi'}</td>
                  <td><span className="pill pill-primary">⚡ {row.xp}</span></td>
                  <td><span className="text-muted" style={{ fontSize: '0.88rem' }}>🌟 {row.level}-daraja</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
